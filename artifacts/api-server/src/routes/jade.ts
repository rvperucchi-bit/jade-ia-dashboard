import { Router, Request, Response } from 'express';
import { engine, JadeAIConfigError } from '../lib/ai/index.js';
import {
  createJadeSession, getJadeSessions, getJadeSession,
  appendJadeMessage, deleteJadeSession, addActivityEvent,
  getCompanyConfig, saveCrmLead, getCrmLeads, updateCrmLead,
  type CompanyConfig, type CrmStatus, type CrmPipeline,
} from '../db/store.js';
import { buildContextForOperation } from '../lib/context/builder.js';
import {
  buildCompanyChunks,
  saveCompanyEmbeddings,
  isEmbeddingStale,
  retrieveRelevantChunks,
} from '../lib/memory/company.js';
import { extractFileContent } from '../lib/file/extractor.js';

const BATCH_SIZE = 5;

const router = Router();


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

// ─── Pending leads per session (in-memory) ────────────────────────────────────
interface PendingLeadResult {
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  totalRatings: number;
}
const sessionPendingLeads = new Map<string, {
  leads: PendingLeadResult[];
  city: string;
  tipo: string;
  total: number;
  shown: number;
}>();

function detectProspectingIntent(text: string): boolean {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/prospeccao|prospectar|lead/.test(lower)) return true;
  // "preciso de clientes/leads", "quero novos clientes", "me traz leads", etc.
  if (/\b(preciso\s+de|quero|me\s+da|me\s+traz|me\s+manda|novos?)\b.{0,30}\b(cliente|lead|prospect|empresa)/.test(lower)) return true;
  const hasVerb   = /\b(busca|encontra|acha|traz|procura|lista|mostra|manda)\b/.test(lower);
  const hasTarget = /\b(cliente|empresa|estabelecimento|negocio|clinica|restaurante|loja|dentista|contato|prospect|barbearia|salao|oficina|escola|academia|comercio|farmacia|hotel)\b/.test(lower);
  return hasVerb && hasTarget;
}


function detectNextLeadRequest(text: string): boolean {
  return /pr[oó]xim[oa]|seguinte|ver?\s+o?\s*pr[oó]x|mais\s+um\s+lead|outro\s+lead|continua|pr[oó]ximo\s+por\s+favor/i.test(text);
}

function extractSearchParams(
  text: string,
  companyConfig: null | { segmento?: string; cidade?: string },
  useCompanyAsPrimary = false,
): { tipo: string; cidade: string } {
  // Normalise (strip diacritics for matching)
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // City: when radar ON and company has city, prefer company city unless message explicitly says "em [outra cidade]"
  const cityMatch = lower.match(/\bem\s+([a-z]{3,}(?:\s+[a-z]{3,})?)/);
  const rawCity = cityMatch ? cityMatch[1] : null;
  const cidade = rawCity
    ? rawCity.replace(/\b\w/g, (c) => c.toUpperCase())
    : (companyConfig?.cidade?.trim() || '');

  // Segment from keywords in message
  const SEGMENT_MAP: [RegExp, string][] = [
    [/clinic|dentist|medic|saude|odont/,               'clínica médica dentista'],
    [/imovel|imobil|aparto|corretor/,                  'imobiliária corretor de imóveis'],
    [/advogad|advocac|juridic/,                        'escritório de advocacia'],
    [/restaur|comida|food|pizza|padari|lanchon/,       'restaurante alimentação'],
    [/salao|barb[ea]ari|estetica|beleza|cosmet/,       'salão de beleza barbearia estética'],
    [/construt|reform|empreit|engenh/,                 'construtora reforma'],
    [/loja|varej|comercio|moda|roupa/,                 'loja comércio varejo'],
    [/escola|educa|faculdad|curso/,                    'escola curso faculdade'],
    [/oficina|mecanica|automobil/,                     'oficina mecânica automotiva'],
    [/marketing|publicidad|agencia/,                   'agência de marketing publicidade'],
    [/consult|tecnolog|software|b2b/,                  'consultoria empresa de tecnologia'],
    [/seguro|financ|credito|consorcio/,                'financeira seguro corretora'],
    [/academia|ginastic|fitness|personal/,             'academia fitness personal trainer'],
    [/hotel|pousad|turism|hospedagem/,                 'hotel pousada turismo'],
    [/farma|drogari/,                                  'farmácia drogaria'],
    [/supermer|mercad/,                                'supermercado mercado'],
    [/petshop|veterina/,                               'petshop veterinária'],
  ];

  for (const [pattern, keyword] of SEGMENT_MAP) {
    if (pattern.test(lower)) return { tipo: keyword, cidade };
  }

  // Fall back to company segment mapping
  const SEGMENT_FALLBACK: Record<string, string> = {
    'Clínicas & Saúde':           'clínicas médicas consultórios dentistas',
    'Imobiliário':                'imobiliárias corretores de imóveis',
    'Advocacia':                  'escritórios de advocacia advogados',
    'Alimentação & Food Service': 'restaurantes lanchonetes pizzarias bares',
    'Beleza':                     'salões de beleza barbearias clínicas estéticas',
    'Serviços de Beleza':         'salões de beleza barbearias clínicas estéticas',
    'Serviços & Construção':      'construtoras empresas de construção reformas',
    'Varejo & E-commerce':        'lojas varejo comércio',
    'Educação':                   'escolas faculdades cursos instituições de ensino',
    'Oficinas & Manutenção':      'oficinas mecânicas manutenção elétrica',
    'Marketing & Publicidade':    'agências de marketing publicidade',
    'Consultoria & B2B/SaaS':     'consultoria empresas tecnologia',
    'Consultoria & B2B':          'consultoria empresas tecnologia',
    'Seguros':                    'corretoras de seguro seguradoras',
    'Seguros & Financeiro':       'corretoras de seguro seguradoras',
    'Financeiro & Crédito':       'financeiras bancos cooperativas de crédito',
    'Crédito & Consórcio':        'financeiras bancos cooperativas de crédito',
    'Moda':                       'lojas de roupa moda boutiques',
    'Outros':                     'empresas comércio',
  };

  if (companyConfig?.segmento) {
    const kw = SEGMENT_FALLBACK[companyConfig.segmento];
    if (kw) return { tipo: kw, cidade };
  }

  return { tipo: 'empresa comércio', cidade };
}

async function searchPlacesForJade(tipo: string, cidade: string, apiKey: string): Promise<PendingLeadResult[]> {
  try {
    const query = `${tipo} em ${cidade}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${apiKey}`;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 12000);
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);

    const data = (await resp.json()) as { status: string; results: any[] };
    if (data.status !== 'OK' || !data.results?.length) return [];

    // Take top 10 results then sort by rating — deliver BATCH_SIZE at a time
    const rawPlaces = data.results.slice(0, 10);

    // Enrich with phone numbers in parallel (best-effort, 5s each)
    const enriched = await Promise.all(
      rawPlaces.map(async (p: any): Promise<PendingLeadResult> => {
        let phone = '';
        try {
          const c2 = new AbortController();
          const t2 = setTimeout(() => c2.abort(), 5000);
          const dr = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number&language=pt-BR&key=${apiKey}`,
            { signal: c2.signal }
          );
          clearTimeout(t2);
          const dd = (await dr.json()) as { result?: { formatted_phone_number?: string } };
          phone = dd.result?.formatted_phone_number ?? '';
        } catch { /* best-effort */ }

        return {
          name:         String(p.name ?? ''),
          address:      String(p.formatted_address ?? p.vicinity ?? ''),
          phone,
          rating:       (p.rating as number | undefined) ?? null,
          totalRatings: (p.user_ratings_total as number | undefined) ?? 0,
        };
      })
    );

    // Sort by rating descending (nulls last)
    enriched.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return enriched;
  } catch {
    return [];
  }
}

const SEGMENT_EMOJI: [RegExp, string][] = [
  [/clinic|dentist|medic|saude|odont/,          '🦷'],
  [/restaur|comida|food|pizza|padari|lanchon/,  '🍽️'],
  [/salao|barb[ea]|estetica|beleza|cosmet/,     '✂️'],
  [/imovel|imobil|corretor/,                    '🏠'],
  [/advogad|advocac|juridic/,                   '⚖️'],
  [/academia|fitness|personal|ginast/,          '💪'],
  [/oficina|mecanica|automobil/,                '🔧'],
  [/escola|educa|faculdad|curso/,               '📚'],
  [/hotel|pousad|turism/,                       '🏨'],
  [/farma|drogari/,                             '💊'],
  [/petshop|veterina/,                          '🐾'],
  [/marketing|publicidad|agencia/,              '📣'],
  [/consult|tecnolog|software|b2b/,             '💼'],
  [/seguro|financ|credito|consorcio/,           '🛡️'],
  [/construt|reform|empreit|engenh/,            '🏗️'],
  [/loja|varej|comercio|moda/,                  '🛍️'],
];

function segmentEmoji(tipo: string): string {
  const lower = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [re, emoji] of SEGMENT_EMOJI) {
    if (re.test(lower)) return emoji;
  }
  return '🏢';
}

function buildAnalysisOnlyPrompt(lead: PendingLeadResult, tipo: string, produto?: string): string {
  const produtoLine = produto ? `\nProduto/serviço sendo prospectado: ${produto}` : '';
  return `Analise este estabelecimento real e responda SOMENTE com estas 3 linhas exatas (sem introdução, sem numeração, sem nada além das 3 linhas):
DOR: [dor específica deste negócio relacionada ao produto abaixo — 1 frase concreta, NÃO genérica]
ANGULO: [melhor ângulo para vender o produto ao dono — 1 frase direta]
PERGUNTA: [pergunta consultiva de abertura para iniciar conversa com o dono — 1 frase]

Estabelecimento: ${lead.name}
Endereço: ${lead.address}
Segmento do prospect: ${tipo || 'comércio geral'}
Avaliação: ${lead.rating ? `${lead.rating} estrelas, ${lead.totalRatings} avaliações` : 'sem dados'}${produtoLine}`;
}

function buildLeadCardText(
  lead: PendingLeadResult,
  idx: number,
  total: number,
  city: string,
  tipo: string,
  isBatchEnd: boolean,
  dor: string,
): string {
  const emoji = segmentEmoji(tipo || lead.name);
  const parts: string[] = [];
  if (lead.phone)  parts.push(`📞 ${lead.phone}`);
  if (lead.rating) parts.push(`⭐ ${lead.rating}`);
  const infoLine = parts.join(' · ');
  const closing = isBatchEnd
    ? `Quer mais ${BATCH_SIZE} opções em ${city}?`
    : 'Abordo esse ou você mesmo fala com ele?';
  const intro = (idx === 1 && city)
    ? `Encontrei ${total} opções em ${city}. Aqui vai o primeiro:\n\n`
    : '';

  const lines: string[] = [`${intro}${emoji} ${lead.name}`, `📍 ${lead.address}`];
  if (infoLine) lines.push(infoLine);
  lines.push('', dor, '', closing);
  return lines.join('\n');
}

function parseAnalysis(text: string): { dor: string; angulo: string; pergunta: string } {
  return {
    dor:      text.match(/DOR:\s*(.+)/i)?.[1]?.trim()                             ?? '',
    angulo:   text.match(/[AÂ]NGULO:\s*(.+)/i)?.[1]?.trim()                       ?? '',
    pergunta: text.match(/PERGUNTA:\s*(.+)/i)?.[1]?.trim()?.replace(/^["']|["']$/g, '') ?? '',
  };
}

// POST /jade/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Support both { messages: Array } and { message: string } formats
    const body = req.body as {
      messages?: Array<{ role: string; content: string }>;
      message?: string;
      session_id?: string;
      radar_on?: boolean;
      user_name?: string;
      company_config?: {
        nome?: string;
        segmento?: string;
        cidade?: string;
        estado?: string;
        tom?: string;
        modoOperacao?: string;
        produtos?: Array<{ nome?: string; valor?: string }>;
      };
    };
    const radarOn = body.radar_on === true;

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

    // Build system prompt with persistent JADE Memory.
    // Primary source: server-stored company config (getCompanyConfig).
    // Backward compat: if nothing stored yet, fall back to client-sent
    // company_config in body (older app behaviour where mobile passed it inline).
    const storedConfig = getCompanyConfig();
    const cc = body.company_config;
    const companyConfig: CompanyConfig | null = storedConfig ?? (
      cc?.segmento ? {
        nome:         cc.nome?.trim()               ?? '',
        produto:      cc.produtos?.[0]?.nome?.trim() ?? '',
        segmento:     cc.segmento,
        tom:          cc.tom                        ?? 'consultivo',
        planos:       cc.produtos?.filter((p: { nome?: string }) => p.nome)
                        .map((p: { nome?: string; valor?: string }) => `${p.nome}${p.valor ? ' — R$ ' + p.valor : ''}`)
                        .join('\n') ?? '',
        cidade:       cc.cidade,
        estado:       cc.estado,
        modoOperacao: cc.modoOperacao,
        updated_at:   '',
      } : null
    );

    const lastMessage = messagesArray[messagesArray.length - 1];
    const lastUserText = lastMessage!.content;
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_PLATFORM_KEY;

    // ─── Path A: "próximo / mais opções" with pending leads in session ────────
    // Returns ALL remaining leads as a numbered list (names only in text).
    // Full data + analysis for each lead comes in `leadsList` array so the
    // client can render an expandable card when the user taps a name.
    if (body.session_id && detectNextLeadRequest(lastUserText)) {
      const pending = sessionPendingLeads.get(body.session_id);
      if (pending && pending.leads.length > 0) {
        const allRemaining = [...pending.leads];
        pending.leads = [];
        pending.shown += allRemaining.length;

        // Generate analysis for every lead in parallel (best-effort)
        const produtoA = (companyConfig as any)?.produto as string | undefined;
        const analyses = await Promise.all(
          allRemaining.map(async (lead) => {
            try {
              const analysisText = await engine.generate({ prompt: buildAnalysisOnlyPrompt(lead, pending.tipo, produtoA), operation: 'chat:lead-analysis' });
              return parseAnalysis(analysisText);
            } catch {
              return { dor: '', angulo: '', pergunta: '' };
            }
          })
        );

        // Text: numbered list of names only
        const listText = `Aqui estão mais opções em ${pending.city}:\n\n${allRemaining.map((l, i) => `${i + 1}. ${l.name}`).join('\n')}`;

        // Full data for each lead (client renders expandable card on tap)
        const leadsList = allRemaining.map((lead, i) => ({
          name:         lead.name,
          address:      lead.address,
          phone:        lead.phone,
          rating:       lead.rating,
          totalRatings: lead.totalRatings,
          cidade:       pending.city,
          segment:      pending.tipo,
          analysis:     analyses[i]!,
        }));

        appendJadeMessage(body.session_id, 'user', lastUserText);
        appendJadeMessage(body.session_id, 'model', listText);
        addActivityEvent({ type: 'lead', text: `JADE listou ${allRemaining.length} leads em ${pending.city}`, icon: 'map-pin', color: '#FF0080' });

        req.log.info({ count: allRemaining.length, city: pending.city }, 'lead list delivered');
        return res.json({
          message: listText,
          leadsList,
          session_id: body.session_id,
          handoff: false,
          statusType: 'lead_list',
        });
      }
    }

    // ─── Path B: New prospecting request → call Google Places ────────────────
    // Explicit prospecting commands always trigger search, regardless of radar toggle.
    // Radar toggle only controls automatic background search (not yet implemented here).
    if (mapsApiKey && detectProspectingIntent(lastUserText)) {
      const { tipo, cidade } = extractSearchParams(lastUserText, companyConfig, true);
      req.log.info({ tipo, cidade }, 'prospecting intent → calling Google Places');

      const places = await searchPlacesForJade(tipo, cidade, mapsApiKey);

      if (places.length > 0) {
        const firstLead = places[0]!;
        const remaining = places.slice(1);

        if (body.session_id) {
          sessionPendingLeads.set(body.session_id, {
            leads: remaining, city: cidade, tipo, total: places.length, shown: 1,
          });
        }

        req.log.info({ tipo, cidade: cidade || '(not set in profile)' }, `[JADE] cidade do perfil: "${companyConfig?.cidade ?? ''}" → busca: "${cidade}"`);
        console.log(`[JADE] cidade do perfil: "${companyConfig?.cidade ?? 'não definida'}" | cidade usada na busca: "${cidade || 'vazia — configure em Minha Empresa'}"`);

        const produtoB = (companyConfig as any)?.produto as string | undefined;
        const analysisPromptB = buildAnalysisOnlyPrompt(firstLead, tipo, produtoB);
        const analysis = parseAnalysis(await engine.generate({ prompt: analysisPromptB, operation: 'chat:lead-analysis' }));
        const cardText = buildLeadCardText(firstLead, 1, places.length, cidade, tipo, false, analysis.dor);

        if (body.session_id) {
          appendJadeMessage(body.session_id, 'user', lastUserText);
          appendJadeMessage(body.session_id, 'model', cardText);
        }
        addActivityEvent({
          type: 'lead',
          text: `JADE encontrou ${places.length} leads reais em ${cidade}`,
          icon: 'map-pin', color: '#FF0080',
          metadata: { cidade, tipo, count: places.length },
        });

        req.log.info({ count: places.length, cidade, tipo }, 'Google Places leads delivered');
        return res.json({
          message: cardText,
          leadData: { name: firstLead.name, address: firstLead.address, phone: firstLead.phone, rating: firstLead.rating, totalRatings: firstLead.totalRatings, cidade, segment: tipo, analysis },
          session_id: body.session_id, handoff: false, statusType: 'radar', leadsFound: places.length,
        });
      }
      // Zero results → fall through to AI Engine for a natural response
    }

    // ─── Path C: JADE AI Engine ───────────────────────────────────────────────
    // Company Memory: lazily refresh embeddings when stale, then retrieve
    // the chunks most semantically relevant to this message.
    let retrievedChunks: string[] = [];
    if (companyConfig?.nome) {
      try {
        if (isEmbeddingStale(companyConfig.nome, companyConfig.updated_at)) {
          // Refresh embeddings in the background — do not await
          void (async () => {
            try {
              const chunks = buildCompanyChunks(companyConfig!);
              if (chunks.length > 0) {
                const embeddings = await engine.embed({ texts: chunks });
                saveCompanyEmbeddings(companyConfig!, chunks, embeddings);
                req.log.info(
                  { company: companyConfig!.nome, chunks: chunks.length },
                  'jade-memory: lazy embedding refresh complete',
                );
              }
            } catch (bgErr) {
              req.log.warn({ err: bgErr }, 'jade-memory: background refresh failed');
            }
          })();
        } else {
          const [queryEmbedding] = await engine.embed({ texts: [lastUserText] });
          if (queryEmbedding) {
            retrievedChunks = retrieveRelevantChunks(companyConfig.nome, queryEmbedding);
            req.log.debug({ count: retrievedChunks.length }, 'jade-memory: chunks retrieved');
          }
        }
      } catch (embErr) {
        req.log.warn({ err: embErr }, 'jade-memory: retrieval skipped (non-fatal)');
      }
    }

    const { systemPrompt, blocks: contextBlocks } = buildContextForOperation('chat', companyConfig, retrievedChunks);
    req.log.debug(
      { profile: 'chat', blocks: contextBlocks, hasMemory: contextBlocks.includes('company-memory-full'), hasEmbedding: contextBlocks.includes('embedding-retrieved') },
      'context built',
    );

    const text = await engine.chat({
      systemPrompt,
      history: messagesArray.slice(0, -1).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      userMessage: lastUserText,
      operation: 'chat',
    });

    req.log.info({ chars: text.length, session_id: body.session_id }, 'JADE responded');

    const handoff = detectBuyingSignal(lastUserText);

    if (body.session_id) {
      appendJadeMessage(body.session_id, 'user', lastUserText);
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

    const prompt = `Você é especialista em prospecção B2B. Gere exatamente 3 leads fictícios mas realistas de estabelecimentos comerciais em ${cidade} do segmento "${tipo}".

Retorne SOMENTE este JSON válido, sem markdown, sem explicações:
{"leads":[{"id":"p_${Date.now()}_1","name":"[nome do contato]","company":"[nome do negócio]","value":[número entre 8000 e 45000],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#6C63FF","time":"agora","initials":"[2 letras]","avatarColor":"#6C63FF","score":[entre 65 e 95],"mensagemAbordagem":"[mensagem WhatsApp personalizada, max 3 linhas, sem ser genérica, menciona o negócio deles]","dorPrincipal":"[principal dor do segmento]"},{"id":"p_${Date.now()}_2","name":"[outro nome]","company":"[outro negócio]","value":[número],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#FF0080","time":"agora","initials":"[2 letras]","avatarColor":"#FF0080","score":[entre 65 e 90],"mensagemAbordagem":"[mensagem personalizada]","dorPrincipal":"[dor]"},{"id":"p_${Date.now()}_3","name":"[outro nome]","company":"[outro negócio]","value":[número],"phone":"+55 11 9${Math.floor(Math.random()*9000+1000)}-${Math.floor(Math.random()*9000+1000)}","column":"novo","tag":"${tipo}","tagColor":"#00D68F","time":"agora","initials":"[2 letras]","avatarColor":"#00D68F","score":[entre 60 e 85],"mensagemAbordagem":"[mensagem personalizada]","dorPrincipal":"[dor]"}]}`;

    const responseText = (await engine.generate({ prompt, operation: 'chat:prospectar' })).trim();

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
    if (error instanceof JadeAIConfigError) {
      return res.status(500).json({ error: error.message, leads: [] });
    }
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
  const session = getJadeSession(String(req.params.id ?? ''));
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
  return res.json({ session });
});

// DELETE /jade/sessions/:id
router.delete('/sessions/:id', (req: Request, res: Response) => {
  const deleted = deleteJadeSession(String(req.params.id ?? ''));
  if (!deleted) return res.status(404).json({ error: 'Sessão não encontrada' });
  return res.json({ ok: true });
});

// ─── CRM ──────────────────────────────────────────────────────────────────────

// POST /jade/crm — save a lead to CRM
router.post('/crm', (req: Request, res: Response) => {
  try {
    const body = req.body as {
      name?: string; phone?: string; address?: string;
      segment?: string; city?: string; status?: CrmStatus;
      pipeline?: CrmPipeline; notes?: string;
    };
    if (!body.name) return res.status(400).json({ error: 'name is required' });
    const lead = saveCrmLead({
      name: body.name,
      phone: body.phone ?? '',
      address: body.address ?? '',
      segment: body.segment ?? '',
      city: body.city ?? '',
      status: body.status ?? 'Primeiro Contato',
      pipeline: body.pipeline ?? 'Novo',
      followUpDate: null,
      attempts: 1,
      notes: body.notes ?? '',
    });
    addActivityEvent({ type: 'lead', text: `CRM: ${lead.name} → ${lead.status}`, icon: 'user-plus', color: '#FF0080' });
    req.log.info({ id: lead.id, name: lead.name }, 'CRM lead saved');
    return res.json({ success: true, lead });
  } catch (err) {
    req.log.error(err, 'CRM save failed');
    return res.status(500).json({ error: 'Failed to save lead' });
  }
});

// GET /jade/crm — list all CRM leads
router.get('/crm', (_req: Request, res: Response) => {
  return res.json({ leads: getCrmLeads() });
});

// PATCH /jade/crm/:id — update lead status / follow-up date
router.patch('/crm/:id', (req: Request, res: Response) => {
  const id = String(req.params['id'] ?? '');
  const updates = req.body as Partial<{
    status: CrmStatus; pipeline: CrmPipeline;
    followUpDate: string | null; attempts: number; notes: string;
  }>;
  const lead = updateCrmLead(id, updates);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  return res.json({ success: true, lead });
});

// ─── Approach message ─────────────────────────────────────────────────────────

// POST /jade/approach — generate WhatsApp approach message for a given lead
router.post('/approach', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      name: string; address?: string; phone?: string;
      segment?: string; city?: string;
      analysis?: { dor?: string; angulo?: string };
    };
    if (!body.name) return res.status(400).json({ error: 'name is required' });

    const companyConfig = getCompanyConfig();

    const companyLine = companyConfig
      ? `Empresa prospectando: ${companyConfig.nome}, vende: ${companyConfig.produto}.`
      : '';
    const dorLine = body.analysis?.dor ? `Dor provável: ${body.analysis.dor}.` : '';
    const cityLine = body.city ? `${body.city}.` : '';

    const prompt = `Escreva uma mensagem de WhatsApp para prospecção fria. Seja direto, humano e informal. Máximo 3 linhas. Sem saudação formal.

Lead: ${body.name}${cityLine ? `, ${cityLine}` : ''}${body.segment ? ` — ${body.segment}` : ''}
${dorLine}
${companyLine}

Responda APENAS com o texto da mensagem, sem aspas, sem markdown, sem emojis no início.`;

    const messageText = (await engine.generate({ prompt, operation: 'approach' })).trim();

    // Format phone for WhatsApp: strip non-digits, prepend 55 if needed
    const digits = (body.phone ?? '').replace(/\D/g, '');
    const intlPhone = digits
      ? digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits
      : '';
    const whatsappUrl = intlPhone
      ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText)}`
      : null;

    req.log.info({ name: body.name, hasPhone: !!intlPhone }, 'approach message generated');
    return res.json({ messageText, whatsappUrl });
  } catch (err) {
    req.log.error(err, 'approach generation failed');
    return res.status(500).json({ error: 'Failed to generate approach message' });
  }
});

// ── POST /api/jade/transcribe ─────────────────────────────────────────────────
// Transcribes a base64-encoded audio clip using OpenAI Whisper
router.post('/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType } = req.body as { audioBase64?: string; mimeType?: string };
  if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

  try {
    const text = await engine.transcribe({ audioBase64, mimeType: mimeType ?? 'audio/m4a' });
    req.log.info({ chars: text.length }, 'audio transcribed via whisper');
    return res.json({ text });
  } catch (err) {
    req.log.error(err, 'transcribe failed');
    return res.status(500).json({ error: 'Transcription failed' });
  }
});

// ── POST /api/jade/analyze-image ──────────────────────────────────────────────
// Receives a base64 image and returns a JADE textual analysis.
// Body: { imageBase64: string, mimeType?: string, prompt?: string, systemPrompt?: string }
// Response: { analysis: string, model: string }
router.post('/analyze-image', async (req: Request, res: Response) => {
  const { imageBase64, mimeType, prompt, systemPrompt } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    prompt?: string;
    systemPrompt?: string;
  };

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 é obrigatório.' });
  }

  const resolvedMime = mimeType ?? 'image/jpeg';
  const validImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validImageMimes.some((m) => resolvedMime.startsWith('image/'))) {
    return res.status(400).json({
      error: `mimeType inválido: ${resolvedMime}. Use image/jpeg, image/png, image/gif ou image/webp.`,
    });
  }

  try {
    const analysis = await engine.analyzeImage({
      imageBase64,
      mimeType: resolvedMime,
      prompt: prompt?.trim() || undefined,
      systemPrompt: systemPrompt?.trim() || undefined,
    });

    req.log.info({ chars: analysis.length }, 'jade: image analyzed');
    return res.json({ analysis, model: 'gpt-4o' });
  } catch (err) {
    req.log.error(err, 'jade: analyze-image failed');
    return res.status(500).json({ error: 'Falha na análise da imagem.' });
  }
});

// ── POST /api/jade/read-file ──────────────────────────────────────────────────
// Receives a base64-encoded file, extracts text (or routes to vision for images),
// and optionally runs the extracted content through JADE for a sales-focused summary.
//
// Body: {
//   fileBase64: string,      — base64 file content
//   mimeType?: string,       — MIME type (inferred from fileName if omitted)
//   fileName?: string,       — original file name (used for MIME inference + display)
//   prompt?: string,         — optional instruction for JADE analysis
//   analyze?: boolean        — if true, send extracted content to JADE chat (default: false)
// }
// Response: {
//   extracted: string,       — raw extracted text (or image analysis)
//   truncated: boolean,
//   analysis?: string,       — present when analyze=true
//   type: 'text'|'image'|'unsupported'
// }
router.post('/read-file', async (req: Request, res: Response) => {
  const { fileBase64, mimeType, fileName, prompt, analyze } = req.body as {
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    prompt?: string;
    analyze?: boolean;
  };

  if (!fileBase64) {
    return res.status(400).json({ error: 'fileBase64 é obrigatório.' });
  }

  const result = extractFileContent(fileBase64, mimeType ?? 'application/octet-stream', fileName);

  if (result.type === 'unsupported') {
    return res.status(422).json({ error: result.reason, type: 'unsupported' });
  }

  // Image: route to vision API for extraction
  if (result.type === 'image') {
    try {
      const imagePrompt =
        prompt?.trim() ||
        'Extraia e descreva todo o conteúdo textual e visual desta imagem de forma estruturada. ' +
        'Inclua: textos presentes, informações de contato, preços, nomes de empresas, produtos ou ' +
        'qualquer dado relevante para vendas.';

      const analysis = await engine.analyzeImage({
        imageBase64: result.base64,
        mimeType: result.mimeType,
        prompt: imagePrompt,
      });

      req.log.info({ fileName, chars: analysis.length }, 'jade: file image analyzed via vision');
      return res.json({
        extracted: analysis,
        truncated: false,
        type: 'image',
        model: 'gpt-4o',
      });
    } catch (err) {
      req.log.error(err, 'jade: read-file vision failed');
      return res.status(500).json({ error: 'Falha ao analisar imagem do arquivo.' });
    }
  }

  // Text: optionally run through JADE for a sales-focused summary
  const extracted = result.content;
  const truncated = result.truncated;

  if (!analyze) {
    req.log.info({ fileName, chars: extracted.length, truncated }, 'jade: file text extracted');
    return res.json({ extracted, truncated, type: 'text' });
  }

  // analyze=true: send extracted text to JADE
  try {
    const companyConfig = getCompanyConfig();
    const { systemPrompt } = buildContextForOperation('chat', companyConfig);
    const userPrompt =
      (prompt?.trim()
        ? `${prompt.trim()}\n\n`
        : 'Analise o conteúdo do arquivo abaixo e extraia os pontos mais relevantes para vendas. ') +
      `Arquivo: ${fileName ?? 'documento'}\n\n---\n${extracted}`;

    const analysis = await engine.chat({
      operation: 'chat',
      systemPrompt,
      history: [],
      userMessage: userPrompt,
    });

    req.log.info({ fileName, chars: extracted.length, truncated }, 'jade: file analyzed by JADE');
    return res.json({ extracted, truncated, analysis, type: 'text' });
  } catch (err) {
    req.log.error(err, 'jade: read-file analysis failed');
    // Return extracted text even if JADE analysis fails
    return res.json({ extracted, truncated, type: 'text', analysisError: String(err) });
  }
});

export default router;
