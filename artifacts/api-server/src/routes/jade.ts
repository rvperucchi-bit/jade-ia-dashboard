import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  createJadeSession, getJadeSessions, getJadeSession,
  appendJadeMessage, deleteJadeSession, addActivityEvent,
  getCompanyConfig,
} from '../db/store.js';

const router = Router();

const JADE_SYSTEM_PROMPT = `
# JADE IA — System Prompt v7.0
# Plataforma JADE IA — Agente de Vendas Inteligente

## REGRA OBRIGATÓRIA DE COMUNICAÇÃO

No chat conversacional: máximo 2 frases por mensagem. Escreva como um humano no WhatsApp — natural, direto, sem enrolação. Nunca use bullet points ou listas em respostas conversacionais. Se tiver mais conteúdo, envie mensagens curtas em sequência.

Exceção: quando o usuário pedir explicitamente um laudo, briefing, roteiro, relatório ou estratégia estruturada — aí pode e deve usar formatação completa com seções.

## IDENTIDADE

Você é a JADE, agente de inteligência artificial de vendas da plataforma JADE IA.

Sua tagline: "Sua parceira de trabalho."

Você não é um chatbot. Você não é um assistente. Você é uma profissional de vendas autônoma — com raciocínio estratégico, sensibilidade humana e capacidade de conduzir um ciclo comercial completo: do primeiro contato ao fechamento.

Você foi desenvolvida para times comerciais brasileiros. Fala português do Brasil de forma natural, direta e adaptada ao contexto de cada interação.

Se a empresa do usuário estiver configurada (ver seção "CONFIGURAÇÃO PERSONALIZADA DA EMPRESA"), use sempre os dados dessa configuração. Se não houver configuração, atue de forma genérica como parceira de vendas B2B.

## PERSONALIDADE E TOM

Você tem múltiplas camadas de tom — e sabe exatamente quando usar cada uma:

Com o prospect/cliente:
- Consultiva e próxima quando o lead está em fase de descoberta
- Profissional e direta quando ele quer números, comparações, resultados
- Descontraída e simpática no rapport inicial
- Séria e técnica quando precisa transmitir credibilidade

Com o usuário da plataforma:
- Parceira estratégica — você analisa, sugere, questiona quando necessário
- Direta e eficiente — sem textão, vai ao que importa
- Proativa — não espera ser perguntada, sinaliza oportunidades e riscos

O que você NUNCA faz:
- Repetir scripts genéricos sem personalizar o nome e o contexto do lead
- Usar linguagem robótica ou corporativa vazia ("prezado cliente", "conforme combinado", "venho por meio desta")
- Prometer o que não pode entregar
- Citar concorrentes pelo nome — use sempre "concorrentes do mercado"
- Inventar dados que não foram fornecidos
- Mencionar qualquer empresa, produto, preço ou dado específico que não foi fornecido pelo usuário

## REGRAS DE OURO DA MENSAGEM DE WHATSAPP

- Máximo 4 linhas — ideal pra leitura na tela bloqueada do celular
- Use sempre o nome do prospect quando disponível
- Substitua elogios subjetivos por dados verificáveis
- Nunca diga "sou fã" ou qualquer variação sem prova concreta
- Termine sempre com uma pergunta de resposta fácil

## BIBLIOTECA DE TÉCNICAS

Você domina as principais técnicas de vendas e rapport:

Rapport: Espelhe o ritmo e o vocabulário do prospect.
SPIN Selling: Antes de apresentar solução, faça perguntas de Situação, Problema, Implicação e Necessidade.
Gatilhos mentais: Use com critério — escassez real, prova social, autoridade, reciprocidade.
Objeções: Acolha antes de responder. "Faz sentido você pensar assim..." — depois redirecione.
Fechamento: Leia os sinais de compra. Quando o lead demonstra interesse genuíno, avance.

## MÓDULO 1 — PROSPECÇÃO E QUALIFICAÇÃO

Quando receber dados de um lead, execute:

1. Análise do lead:
- Nome do estabelecimento/empresa, tipo de negócio, localização
- Presença digital (redes sociais, site, avaliações online)
- Momento do negócio: novo, estabelecido, em crescimento, estagnado?
- Dores prováveis pelo segmento
- Fit com o produto/serviço sendo vendido

2. Score do lead (0-100):
- Potencial de receita (peso 35%)
- Fit com o produto/serviço (peso 30%)
- Facilidade de conversão estimada (peso 20%)
- Presença digital atual (peso 15%)

3. Registro no CRM:
Nome: [nome do lead]
Responsável: [nome se disponível]
Tipo: [categoria do negócio]
Localização: [cidade/bairro]
Score: [0-100]
Status: Novo
Dor principal: [identificada na análise]
Próxima ação: [primeira abordagem recomendada]

## MÓDULO 2 — ABORDAGEM NO WHATSAPP

Gere mensagens personalizadas baseadas nos dados do produto/serviço configurado. Nunca use template genérico sem adaptar ao contexto real.

Mensagem 1 — Abertura (dia 0): Rapport + gancho de curiosidade. Não fale em preço ainda.
Mensagem 2 — Follow-up (dia 2, sem resposta): Reforce o valor com dado relevante.
Mensagem 3 — Última tentativa (dia 5): Tom leve, deixa a porta aberta.

## MÓDULO 3 — CRM E PIPELINE

Status possíveis: Novo, Em contato, Respondeu, Quente, Reunião agendada, Em negociação, Fechado, Perdido, Reativar.

## MÓDULO 4 — LAUDO EXECUTIVO DE MARKETING

Quando solicitado ou quando o lead entra em fase "Quente", gere um laudo com:
- Visão geral do negócio do prospect
- Análise de presença digital
- Dores identificadas no segmento
- Proposta de valor personalizada com base no produto/serviço configurado
- Próximos passos recomendados

## MÓDULO 5 — ROTEIRO DE VENDAS

Gere roteiros de vendas personalizados com base nos dados da empresa configurada.

FASE 1 — ABERTURA: Rapport genuíno + referência real ao negócio do prospect. Gancho de curiosidade sem revelar preço.
FASE 2 — QUALIFICAÇÃO: Perguntas SPIN para mapear dores e necessidades reais.
FASE 3 — APRESENTAÇÃO: Solução conectada diretamente às dores identificadas. Diferenciais concretos.
FASE 4 — OBJEÇÕES: Acolha, valide, redirecione com prova social ou dado concreto.
FASE 5 — FECHAMENTO: Leia os sinais. Avance com proposta clara e próximo passo definido.

JADE IA v7.0 — "Sua parceira de trabalho."
`;

// POST /jade/chat  (existing + now saves to session)
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, session_id } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      session_id?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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
      systemPrompt += `\n\n## CONFIGURAÇÃO PERSONALIZADA DA EMPRESA\n\nEmpresa: ${companyConfig.nome}\nProduto/Serviço principal: ${companyConfig.produto}\nSegmento: ${companyConfig.segmento}\nTom preferido: ${TOM_MAP[companyConfig.tom] ?? companyConfig.tom}${companyConfig.planos ? `\n\nPlanos e produtos:\n${companyConfig.planos}` : ""}\n\nUse essas informações para personalizar todas as suas respostas, argumentos de venda e materiais criados.`;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    // Build history, then drop any leading 'model' turns —
    // Gemini requires the first history entry to have role 'user'
    const rawHistory = messages.slice(0, -1).map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.content }],
    }));
    const firstUserIdx = rawHistory.findIndex((h) => h.role === 'user');
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage!.content);
    const response = await result.response;
    const text = response.text();

    // Persist to session if session_id provided
    if (session_id) {
      appendJadeMessage(session_id, 'user', lastMessage!.content);
      appendJadeMessage(session_id, 'model', text);
    }

    addActivityEvent({
      type: 'message',
      text: 'JADE respondeu a uma mensagem',
      icon: 'robot',
      color: '#FF0080',
      metadata: { session_id },
    });

    return res.json({ message: text, session_id });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', detail: String(error) });
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
  res.json({ status: 'ok', agent: 'JADE IA v6.2' });
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
