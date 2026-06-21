import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  createJadeSession, getJadeSessions, getJadeSession,
  appendJadeMessage, deleteJadeSession, addActivityEvent,
  getCompanyConfig,
} from '../db/store.js';

const router = Router();

const JADE_SYSTEM_PROMPT = `
# JADE IA — Sistema de Vendas v9.0

Você é JADE, agente de vendas IA da plataforma JADE IA. Parceira de trabalho — não assistente, não chatbot.

🎯 REGRA PRINCIPAL
Chat conversacional: máximo 2 frases por resposta. Escreva como WhatsApp — direto, sem enrolação. Zero bullet points em respostas conversacionais.

🚨 DETECTOR DE COMPRA
Palavras como "quanto custa", "como contratar", "quero fechar", "qual o preço", "formas de pagamento" → mude imediatamente para modo fechamento. Não qualifique quem já quer comprar.

💬 TOM
Com prospect: consultivo e próximo no início, direto e concreto quando ele quer números.
Com usuário da plataforma: parceira estratégica, direta, proativa — sem textão.

🚫 NUNCA
Scripts genéricos sem personalizar o lead. Linguagem corporativa vazia. Inventar dados não fornecidos. Citar concorrentes pelo nome.

📋 DOCUMENTOS (laudo, briefing, roteiro, relatório, proposta)
Use formatação completa: seções com títulos, bullet points e dados concretos.

📊 MÓDULOS
Prospecção: analise lead → score 0-100 (receita 35%, fit 30%, conversão 20%, digital 15%) → próxima ação.
WhatsApp: Abertura dia 0 (rapport+gancho sem revelar preço), Follow-up dia 2 (valor concreto), Última tentativa dia 5 (tom leve).
CRM: Novo → Em contato → Quente → Negociação → Fechado/Perdido/Reativar.
Roteiro: Abertura → SPIN Selling → Apresentação → Objeções (acolha+redirecione) → Fechamento.
Laudo: negócio do prospect, presença digital, dores, proposta de valor personalizada, próximos passos.

Se houver configuração da empresa, use sempre esses dados. Caso contrário, atue como parceira de vendas B2B genérica.

JADE IA v9.0 — "Sua parceira de trabalho."
`;

const BUYING_SIGNALS = [
  'quanto custa', 'qual o preço', 'qual o preco', 'como funciona o contrato',
  'quando começa', 'quando comeca', 'formas de pagamento', 'posso testar',
  'tem desconto', 'vou comprar', 'quero fechar', 'aceito a proposta',
  'pode me mandar', 'como contratar', 'como assinar', 'manda a proposta',
  'qual o valor', 'qual o investimento', 'como adquirir',
];

function detectBuyingSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return BUYING_SIGNALS.some((s) => lower.includes(s));
}

// POST /jade/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Support both { messages: Array } and { message: string } formats
    const body = req.body as {
      messages?: Array<{ role: string; content: string }>;
      message?: string;
      session_id?: string;
    };

    let messagesArray: Array<{ role: string; content: string }>;

    if (body.message && typeof body.message === 'string') {
      messagesArray = [{ role: 'user', content: body.message }];
    } else if (body.messages && Array.isArray(body.messages)) {
      messagesArray = body.messages;
    } else {
      return res.status(400).json({ error: 'messages array or message string is required' });
    }

    if (messagesArray.length === 0) {
      return res.status(400).json({ error: 'messages cannot be empty' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      req.log.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build dynamic system prompt — append company config if configured
    const companyConfig = getCompanyConfig();
    let systemPrompt = JADE_SYSTEM_PROMPT;
    if (companyConfig) {
      const TOM_MAP: Record<string, string> = {
        formal: "Formal e corporativo",
        consultivo: "Consultivo e estratégico",
        descontraido: "Descontraído e próximo",
        agressivo: "Agressivo (foco em fechamento rápido)",
        empatico: "Empático e acolhedor",
      };
      const MODO_MAP: Record<string, string> = {
        fechamento: "Direto ao Fechamento — produto simples, decide na hora. Vá direto para a venda.",
        consultivo_presencial: "Agendar + Fechar Presencial — venda consultiva, ticket alto. Agende reuniões.",
        nutricao: "Nutrição + Relacionamento — ciclo longo. Nutra o lead até estar pronto para comprar.",
      };
      systemPrompt += `\n\n## CONFIGURAÇÃO PERSONALIZADA DA EMPRESA\n\nEmpresa: ${companyConfig.nome}\nProduto/Serviço principal: ${companyConfig.produto}\nSegmento: ${companyConfig.segmento}\nTom preferido: ${TOM_MAP[companyConfig.tom] ?? companyConfig.tom}`;
      if ((companyConfig as any).modoOperacao) {
        systemPrompt += `\nModo de operação: ${MODO_MAP[(companyConfig as any).modoOperacao] ?? (companyConfig as any).modoOperacao}`;
      }
      if (companyConfig.planos) {
        systemPrompt += `\n\nPlanos e produtos:\n${companyConfig.planos}`;
      }
      systemPrompt += `\n\nUse essas informações para personalizar todas as suas respostas, argumentos de venda e materiais criados.`;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
    });

    // Build history, then drop any leading 'model' turns —
    // Gemini requires the first history entry to have role 'user'
    const rawHistory = messagesArray.slice(0, -1).map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.content }],
    }));
    const firstUserIdx = rawHistory.findIndex((h) => h.role === 'user');
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const lastMessage = messagesArray[messagesArray.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage!.content);
    const response = await result.response;
    const text = response.text();

    req.log.info({ chars: text.length, session_id: body.session_id }, 'JADE responded');

    // Detect buying signals in the last user message
    const handoff = detectBuyingSignal(lastMessage!.content);

    // Persist to session if session_id provided
    if (body.session_id) {
      appendJadeMessage(body.session_id, 'user', lastMessage!.content);
      appendJadeMessage(body.session_id, 'model', text);
    }

    addActivityEvent({
      type: 'message',
      text: 'JADE respondeu a uma mensagem',
      icon: 'robot',
      color: '#FF0080',
      metadata: { session_id: body.session_id },
    });

    return res.json({
      message: text,
      session_id: body.session_id,
      handoff,
      ...(handoff ? { motivo: 'Sinal de compra detectado na mensagem' } : {}),
    });

  } catch (error) {
    req.log.error({ error }, 'Error in /jade/chat');
    return res.status(500).json({ error: 'Internal server error', detail: String(error) });
  }
});

// POST /jade/prospectar — Autonomous prospecting
router.post('/prospectar', async (req: Request, res: Response) => {
  try {
    const { cidade = 'São Paulo', tipo = 'comércio', existingIds = [] } = req.body as {
      cidade?: string;
      tipo?: string;
      existingIds?: string[];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured', leads: [] });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Você é especialista em prospecção B2B. Gere exatamente 3 leads fictícios mas realistas de estabelecimentos comerciais em ${cidade} do segmento "${tipo}".

Retorne SOMENTE este JSON válido, sem markdown, sem explicações:
{"leads":[{"id":"p_${Date.now()}_1","name":"[nome do contato]","company":"[nome do negócio]","value":[número entre 8000 e 45000],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#6C63FF","time":"agora","initials":"[2 letras]","avatarColor":"#6C63FF","score":[entre 65 e 95],"mensagemAbordagem":"[mensagem WhatsApp personalizada, max 3 linhas, sem ser genérica, menciona o negócio deles]","dorPrincipal":"[principal dor do segmento]"},{"id":"p_${Date.now()}_2","name":"[outro nome]","company":"[outro negócio]","value":[número],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#FF0080","time":"agora","initials":"[2 letras]","avatarColor":"#FF0080","score":[entre 65 e 90],"mensagemAbordagem":"[mensagem personalizada]","dorPrincipal":"[dor]"},{"id":"p_${Date.now()}_3","name":"[outro nome]","company":"[outro negócio]","value":[número],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#00D68F","time":"agora","initials":"[2 letras]","avatarColor":"#00D68F","score":[entre 60 e 85],"mensagemAbordagem":"[mensagem personalizada]","dorPrincipal":"[dor]"}]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ leads: [], count: 0 });
    }

    const data = JSON.parse(jsonMatch[0]) as { leads: any[] };
    const newLeads = (data.leads ?? []).filter((l: any) => !existingIds.includes(l.id));

    if (newLeads.length > 0) {
      addActivityEvent({
        type: 'scan',
        text: `JADE encontrou ${newLeads.length} novo${newLeads.length > 1 ? 's' : ''} lead${newLeads.length > 1 ? 's' : ''} via radar em ${cidade}`,
        icon: 'crosshair',
        color: '#6C63FF',
        metadata: { count: newLeads.length, cidade },
      });
    }

    req.log.info({ count: newLeads.length, cidade, tipo }, 'JADE prospectar completed');
    return res.json({ leads: newLeads, count: newLeads.length });

  } catch (error) {
    req.log.error({ error }, 'Error in /jade/prospectar');
    return res.json({ leads: [], count: 0 });
  }
});

// ── JADE status & autonomous mode ──────────────────────────────────────────
let jadeStatus = { ativo: false, updatedAt: new Date().toISOString() };
let jadeAutonomo = { ativo: false, logs: [] as { texto: string; hora: string }[] };

router.get('/status', (_req: Request, res: Response) => {
  res.json(jadeStatus);
});

router.post('/status', (req: Request, res: Response) => {
  const { ativo } = req.body as { ativo: boolean };
  jadeStatus = { ativo: !!ativo, updatedAt: new Date().toISOString() };
  if (ativo) {
    addActivityEvent({ type: 'message', text: 'JADE ativada no modo autônomo', icon: 'robot', color: '#00D68F' });
  }
  res.json(jadeStatus);
});

router.get('/autonomo', (_req: Request, res: Response) => {
  res.json(jadeAutonomo);
});

router.post('/autonomo', (req: Request, res: Response) => {
  const { ativo } = req.body as { ativo: boolean };
  jadeAutonomo.ativo = !!ativo;
  if (!ativo) jadeAutonomo.logs = [];
  res.json(jadeAutonomo);
});

// GET /jade/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', agent: 'JADE IA v8.0' });
});

// GET /jade/sessions
router.get('/sessions', (_req: Request, res: Response) => {
  const sessions = getJadeSessions().map((s) => ({
    id: s.id,
    title: s.title,
    message_count: s.messages.length,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));
  return res.json({ sessions });
});

// POST /jade/sessions — create new session
router.post('/sessions', (req: Request, res: Response) => {
  const { title } = req.body as { title?: string };
  const session = createJadeSession(title ?? 'Nova conversa');
  return res.status(201).json({ session });
});

// GET /jade/sessions/:id
router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = getJadeSession(req.params.id ?? '');
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
  return res.json({ session });
});

// DELETE /jade/sessions/:id
router.delete('/sessions/:id', (req: Request, res: Response) => {
  const deleted = deleteJadeSession(req.params.id ?? '');
  if (!deleted) return res.status(404).json({ error: 'Sessão não encontrada' });
  return res.json({ ok: true });
});

export default router;
