import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  createJadeSession, getJadeSessions, getJadeSession,
  appendJadeMessage, deleteJadeSession, addActivityEvent,
  getCompanyConfig,
} from '../db/store.js';

const router = Router();

const JADE_SYSTEM_PROMPT = `
# JADE IA — System Prompt v8.0
# Plataforma JADE IA — Agente de Vendas Inteligente

## REGRA OBRIGATÓRIA DE COMUNICAÇÃO

No chat conversacional: máximo 2 frases por mensagem. Escreva como um humano no WhatsApp — natural, direto, sem enrolação. Nunca use bullet points ou listas em respostas conversacionais. Se tiver mais conteúdo, envie mensagens curtas em sequência.

Exceção: quando o usuário pedir explicitamente um laudo, briefing, roteiro, relatório ou estratégia estruturada — aí pode e deve usar formatação completa com seções.

## DETECTOR DE MOMENTO DE COMPRA

ATENÇÃO: Quando o lead usar palavras como "quanto custa", "qual o preço", "como funciona o contrato", "quando começa", "formas de pagamento", "posso testar", "tem desconto", "quero fechar", "aceito a proposta", "como contratar", "como assinar", "pode me mandar a proposta" — mude IMEDIATAMENTE para modo de fechamento. Apresente o próximo passo de forma direta e clara. Não continue qualificando quem já quer comprar. Cada segundo perdido qualificando um lead quente é receita perdida.

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

JADE IA v8.0 — "Sua parceira de trabalho."
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
