/**
 * WhatsApp Business / Meta — integração básica e segura
 *
 * Fluxo:
 *   Meta → POST /webhook → handleInboundText → JADE AI Engine → sendWA
 *
 * Endpoints:
 *   GET  /api/whatsapp/webhook  — verificação de webhook pela Meta (hub.challenge)
 *   POST /api/whatsapp/webhook  — mensagens inbound da Meta
 *   POST /api/whatsapp/send     — envio manual / teste (requer { to, message })
 *
 * Variáveis necessárias (via Secrets):
 *   WHATSAPP_TOKEN              — Bearer token permanente da Meta
 *   WHATSAPP_PHONE_NUMBER_ID    — ID do número de telefone no Meta Business
 *   WHATSAPP_VERIFY_TOKEN       — token de verificação configurado no painel Meta
 */

import { Router, type Request, type Response } from "express";
import { engine, JadeAIConfigError } from "../lib/ai/index.js";
import {
  createJadeSession,
  getJadeSession,
  appendJadeMessage,
  getCompanyConfig,
  addActivityEvent,
} from "../db/store.js";
import { buildContextForOperation } from "../lib/context/builder.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── Phone → Session mapping (in-memory; recria sessão automaticamente se
//    o servidor reiniciar — histórico anterior é perdido mas não quebra nada)
const phoneSessionMap = new Map<string, string>();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: enviar texto pelo WhatsApp
// ─────────────────────────────────────────────────────────────────────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TOKEN não configurados"
    );
  }

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API ${res.status}: ${JSON.stringify(data)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: obtém sessão existente ou cria uma nova por número de telefone
// ─────────────────────────────────────────────────────────────────────────────
function getOrCreateSession(phone: string): string {
  const existingId = phoneSessionMap.get(phone);
  if (existingId && getJadeSession(existingId)) {
    return existingId;
  }

  const session = createJadeSession(`WhatsApp +${phone}`);
  phoneSessionMap.set(phone, session.id);
  logger.info({ phone, sessionId: session.id }, "whatsapp: nova sessão criada");
  return session.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: recebe texto → processa com JADE → responde
// ─────────────────────────────────────────────────────────────────────────────
async function handleInboundText(phone: string, userText: string): Promise<void> {
  logger.info({ phone, chars: userText.length }, "whatsapp: inbound ↓");

  const sessionId = getOrCreateSession(phone);

  // Histórico da sessão → contexto para a IA
  // Store usa "model"; NormalizedMessage do engine usa "assistant"
  const session = getJadeSession(sessionId);
  const history = (session?.messages ?? []).map((m) => ({
    role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
    content: m.content,
  }));

  // System prompt via JADE Context Builder (com JADE Memory, objeções, SPIN etc.)
  const companyConfig = getCompanyConfig();
  const { systemPrompt } = buildContextForOperation("chat", companyConfig);

  // ── Chamar JADE AI Engine ────────────────────────────────────────────────
  let reply: string;
  try {
    reply = await engine.chat({
      operation: "chat",
      systemPrompt,
      history,
      userMessage: userText,
    });
  } catch (err) {
    if (err instanceof JadeAIConfigError) {
      logger.error({ err: String(err) }, "whatsapp: JADE AI config error");
      await sendWhatsAppMessage(
        phone,
        "Desculpe, encontrei um problema de configuração. Tente novamente em breve."
      );
      return;
    }
    throw err;
  }

  // ── Persistir mensagens na sessão ────────────────────────────────────────
  appendJadeMessage(sessionId, "user", userText);
  appendJadeMessage(sessionId, "model", reply);

  // ── Registrar no feed de atividades ─────────────────────────────────────
  addActivityEvent({
    type: "message",
    text: `WhatsApp +${phone} ↔ JADE — resposta enviada`,
    icon: "message-circle",
    color: "#25D366",
  });

  // ── Enviar resposta pelo WhatsApp ────────────────────────────────────────
  await sendWhatsAppMessage(phone, reply);

  logger.info(
    { phone, sessionId, replyChars: reply.length },
    "whatsapp: outbound ↑"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook — verificação pela Meta (hub.challenge)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/webhook", (req: Request, res: Response) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    req.log.info("whatsapp: webhook verificado com sucesso");
    return res.status(200).send(challenge);
  }

  req.log.warn(
    { mode, tokenOk: token === process.env.WHATSAPP_VERIFY_TOKEN },
    "whatsapp: verificação falhou — token incorreto ou mode inválido"
  );
  return res.sendStatus(403);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook — mensagens inbound da Meta
// ─────────────────────────────────────────────────────────────────────────────
router.post("/webhook", (req: Request, res: Response) => {
  // Responder 200 IMEDIATAMENTE — Meta retenta se não receber resposta rápida
  res.sendStatus(200);

  const body = req.body as Record<string, unknown>;

  // Ignorar payloads que não são do WhatsApp Business
  if (body.object !== "whatsapp_business_account") return;

  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];

    for (const change of changes) {
      const value = change.value as Record<string, unknown>;

      // Ignorar status updates (delivered, read, failed) — não são mensagens
      const statuses = (value?.statuses as Array<unknown>) ?? [];
      if (statuses.length > 0) continue;

      const messages = (value?.messages as Array<Record<string, unknown>>) ?? [];

      for (const msg of messages) {
        const msgType = msg.type as string;
        const from    = msg.from as string;

        if (!from) continue;

        // Ignorar tipos não suportados sem quebrar o webhook
        if (msgType !== "text") {
          req.log.info(
            { from, type: msgType },
            "whatsapp: tipo de mensagem não suportado — ignorando"
          );
          continue;
        }

        const text = (msg.text as Record<string, string>)?.body?.trim() ?? "";
        if (!text) continue;

        // Processar assíncronamente — 200 já foi enviado
        void handleInboundText(from, text).catch((err) => {
          logger.error(
            { from, err: String(err) },
            "whatsapp: erro não tratado ao processar mensagem"
          );
        });
      }
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /send — envio manual / teste
// ─────────────────────────────────────────────────────────────────────────────
router.post("/send", async (req: Request, res: Response) => {
  const { to, message } = req.body as { to?: string; message?: string };

  if (!to || !message) {
    return res
      .status(400)
      .json({ error: "Campos 'to' e 'message' são obrigatórios." });
  }

  try {
    await sendWhatsAppMessage(to, message);
    req.log.info({ to }, "whatsapp: envio manual ↑");
    return res.status(200).json({ ok: true, to });
  } catch (err) {
    req.log.error({ to, err: String(err) }, "whatsapp: erro no envio manual");
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
