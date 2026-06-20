import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const PLANOS = {
  start:      { nome: 'Start',      preco: 9700 },
  pro:        { nome: 'Pro',        preco: 24700 },
  enterprise: { nome: 'Enterprise', preco: 69700 },
} as const;

type PlanoKey = keyof typeof PLANOS;

// ─── Subscriptions file store ─────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '..', '..', 'data');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

function readSubs(): Record<string, any> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SUBS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8')) as Record<string, any>;
  } catch { return {}; }
}

function writeSubs(data: Record<string, any>) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SUBS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch { /* ignore write errors */ }
}

// ─── POST /stripe/create-checkout ────────────────────────────────────────────
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const { plano, email } = req.body as { plano?: string; email?: string };

    if (!plano || !(plano in PLANOS)) {
      return res.status(400).json({ error: 'Plano inválido. Use: start, pro, enterprise.' });
    }

    const planoInfo = PLANOS[plano as PlanoKey];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      metadata: { plano },
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `JADE IA — Plano ${planoInfo.nome}`,
            description: 'Agente de vendas com IA para o mercado brasileiro',
          },
          unit_amount: planoInfo.preco,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `https://jade-ia-dashboard.replit.app/sucesso?session_id={CHECKOUT_SESSION_ID}&plano=${plano}`,
      cancel_url:  'https://jade-ia-dashboard.replit.app/planos',
    });

    req.log.info({ plano, sessionId: session.id }, 'Stripe checkout session created');
    return res.json({ url: session.url, sessionId: session.id });

  } catch (error) {
    req.log.error({ error }, 'Error creating Stripe checkout session');
    return res.status(500).json({ error: 'Erro ao criar sessão de checkout. Tente novamente.' });
  }
});

// ─── POST /stripe/webhook ─────────────────────────────────────────────────────
// Note: registered via app.use("/api", router) so body is already parsed JSON.
// Signature verification is skipped unless STRIPE_WEBHOOK_SECRET is configured.
router.post('/webhook', async (req: Request, res: Response) => {
  const sig         = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      const sigStr = Array.isArray(sig) ? sig[0]! : sig;
      // req.body may be a Buffer (if registered with express.raw) or parsed object
      const raw = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(raw, sigStr, webhookSecret);
    } catch (err) {
      req.log.error({ err }, 'Stripe webhook signature verification failed');
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  } else {
    event = req.body as Stripe.Event;
  }

  const subs = readSubs();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email   = session.customer_email ?? session.customer_details?.email;
      const plano   = session.metadata?.plano ?? 'start';
      if (email) {
        subs[email] = {
          plano,
          subscriptionId: session.subscription,
          status:    'active',
          updatedAt: new Date().toISOString(),
        };
        writeSubs(subs);
        req.log.info({ email, plano }, 'Subscription activated via webhook');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      for (const [email, data] of Object.entries(subs)) {
        if ((data as any).subscriptionId === sub.id) {
          subs[email] = { ...(data as any), plano: 'start', status: 'cancelled', updatedAt: new Date().toISOString() };
          break;
        }
      }
      writeSubs(subs);
      req.log.info({ subscriptionId: sub.id }, 'Subscription cancelled');
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      req.log.warn({ customer: invoice.customer }, 'Invoice payment failed');
      break;
    }
  }

  return res.json({ received: true });
});

// ─── GET /stripe/subscription/:email ─────────────────────────────────────────
router.get('/subscription/:email', (req: Request, res: Response) => {
  const email = decodeURIComponent(req.params.email ?? '');
  const subs  = readSubs();
  const sub   = subs[email];

  if (!sub) {
    return res.json({ plano: 'start', status: 'inactive' });
  }

  return res.json(sub);
});

export default router;
