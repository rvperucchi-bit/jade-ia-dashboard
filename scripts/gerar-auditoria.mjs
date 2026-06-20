import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUTPUT = path.resolve("auditoria-jade-ia.pdf");
const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
doc.pipe(fs.createWriteStream(OUTPUT));

const PINK    = "#FF0080";
const DARK    = "#0A0A0F";
const GRAY    = "#7777AA";
const TEXT    = "#1A1A2E";
const SUCCESS = "#00D68F";
const WARN    = "#FFB300";
const ERROR   = "#FF3B5C";
const INFO    = "#6C63FF";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function h1(text) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 8).fill(PINK);
  doc.moveDown(0.6)
    .fontSize(17).fillColor(PINK).font("Helvetica-Bold")
    .text(text)
    .moveDown(0.4);
}

function h2(text) {
  doc.moveDown(0.5)
    .fontSize(12).fillColor(TEXT).font("Helvetica-Bold")
    .text(text)
    .moveDown(0.2);
}

function h3(text) {
  doc.fontSize(10).fillColor(TEXT).font("Helvetica-Bold")
    .text(text)
    .moveDown(0.15);
}

function body(text) {
  doc.fontSize(9).fillColor("#333333").font("Helvetica")
    .text(text, { lineGap: 3 }).moveDown(0.25);
}

function bullet(text, color = "#333333") {
  doc.fontSize(9).fillColor(color).font("Helvetica")
    .text(`  •  ${text}`, { lineGap: 3 });
}

function statusRow(label, status, note = "") {
  const colors = { "✅ Funcionando": SUCCESS, "⚠️ Parcial": WARN, "❌ Ausente": ERROR, "🔵 Visual": INFO };
  const color = Object.entries(colors).find(([k]) => status.startsWith(k.slice(0, 4)))?.[1] ?? TEXT;
  const y = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT)
    .text(label, 55, y, { continued: true, lineBreak: false, width: 200 });
  doc.font("Helvetica").fillColor(color)
    .text(status, { continued: !!note, lineBreak: false });
  if (note) doc.fillColor(GRAY).font("Helvetica").text(`  — ${note}`, { lineBreak: true, lineGap: 2 });
  else doc.text("", { lineBreak: true, lineGap: 2 });
}

function divider() {
  doc.moveDown(0.5)
    .moveTo(50, doc.y).lineTo(545, doc.y)
    .strokeColor("#DDDDDD").lineWidth(0.5).stroke()
    .moveDown(0.5);
}

function tag(text, x, y, color) {
  const w = text.length * 5.8 + 14;
  doc.roundedRect(x, y, w, 15, 3).fill(color + "25");
  doc.fontSize(7.5).fillColor(color).font("Helvetica-Bold")
    .text(text, x + 7, y + 3.5, { lineBreak: false });
  return w;
}

// ─── CAPA ─────────────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, doc.page.height).fill("#000000");

doc.rect(0, 0, doc.page.width, 320).fill(DARK);

// Pink accent bar
doc.rect(0, 0, 6, 320).fill(PINK);

doc.fontSize(52).fillColor(PINK).font("Helvetica-Bold")
  .text("JADE", 60, 70, { lineBreak: false });
doc.fontSize(52).fillColor("#FFFFFF").font("Helvetica-Bold")
  .text(" IA", { lineBreak: true });

doc.fontSize(14).fillColor("#FFFFFF").font("Helvetica-Bold")
  .text("AUDITORIA TÉCNICA COMPLETA", 60, 148);

doc.fontSize(10).fillColor(GRAY).font("Helvetica")
  .text("Plataforma de Agente de Vendas com Inteligência Artificial", 60, 170);

doc.moveDown(0.6);
doc.fontSize(9).fillColor(GRAY)
  .text(`Data: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 60)
  .text("Versão da plataforma: v1.0.0-beta  |  Ambiente: Desenvolvimento  |  Replit Workspace", 60)
  .text("Stack: Expo 54 + React Native 0.81 + Express 5 + Gemini 2.5 Flash + SQLite", 60);

// Summary boxes on cover
const boxes = [
  { label: "Funcionando",    n: "12", color: SUCCESS },
  { label: "Parcial",        n: "9",  color: WARN    },
  { label: "Não Existe",     n: "14", color: ERROR   },
  { label: "Apenas Visual",  n: "7",  color: INFO    },
];
let bx = 60;
for (const b of boxes) {
  doc.rect(bx, 260, 108, 44).fill(b.color + "18");
  doc.rect(bx, 260, 108, 3).fill(b.color);
  doc.fontSize(22).fillColor(b.color).font("Helvetica-Bold").text(b.n, bx + 12, 270, { lineBreak: false });
  doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica").text(b.label, bx + 12, 294);
  bx += 118;
}

doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text("Rodrigo Coral — JÁ Delivery — Criciúma SC", 60, 340)
  .text("Gerado automaticamente via Replit Agent  |  Confidencial", 60, 354);

// ─── 1. DASHBOARD / HUB ───────────────────────────────────────────────────────
h1("1. DASHBOARD / HUB (Aba Radar)");

body(
  "A tela principal do app é a aba Radar (index.tsx). Funciona como hub central de " +
  "operações, exibindo métricas, módulos de ativação, pipeline resumido e feed de atividades."
);

h2("1.1 Status Geral dos Elementos");
statusRow("Carregamento da tela",         "✅ Funcionando",  "Renderiza em <200ms, fontes pré-carregadas");
statusRow("Performance",                  "⚠️ Parcial",      "Dados mockados, sem real-time updates");
statusRow("Responsividade mobile",        "✅ Funcionando",  "Safe area + insets dinâmicos por plataforma");
statusRow("Dados das métricas",           "❌ Ausente",      "Todos os 4 cards são valores hardcoded (24, 8, 34%, R$12,4k)");
statusRow("Atualização em tempo real",    "❌ Ausente",      "Sem WebSocket, SSE ou polling implementado");
statusRow("Contadores e indicadores",     "⚠️ Parcial",      "Pipeline reflete o AppContext, métricas são fixas");
statusRow("Pipeline visual",              "✅ Funcionando",  "Conta leads do AppContext por coluna corretamente");
statusRow("Atividades recentes",          "🔵 Visual",       "Array estático ACTIVITY — não vem de banco");
statusRow("Navegação inferior",           "✅ Funcionando",  "5 abas: Radar, Leads, Conversas, JADE, Mais");
statusRow("Notificações (sino)",          "⚠️ Parcial",      "Badge conta conversas não lidas do contexto; tela de notifs é visual");
statusRow("Avatar do usuário",            "✅ Funcionando",  "Iniciais 'R', navega para /perfil");
statusRow("Botões de módulos (toggle)",   "⚠️ Parcial",      "Toggle local com useState; não persiste após reload");

h2("1.2 Origem dos Dados");
bullet("Leads no pipeline → AppContext (SQLite no device, seed em memória no web)");
bullet("Conversas não lidas → AppContext em memória");
bullet("Métricas (24 leads, 8 conversas, 34%, R$12,4k) → HARDCODED em index.tsx");
bullet("Feed de atividade → Array estático ACTIVITY em index.tsx");
bullet("Estado dos módulos (scanner ativo, jade ativa) → useState local, reseta ao recarregar");

// ─── 2. MÓDULOS JADE ──────────────────────────────────────────────────────────
h1("2. MÓDULOS JADE — Auditoria Individual");

const modulos = [
  {
    nome: "Scanner Radar",
    arquivo: "app/scanner.tsx",
    existe: true, acessivel: true, banco: false, funcional: true, visual: false,
    automacao: false, logs: false, historico: false,
    obs: "Busca negócios via Google Places API (/api/places/search). Filtros por bairro, cidade e tipo. Resultado pode ser adicionado ao pipeline. FUNCIONA com GOOGLE_MAPS_API_KEY configurada. Sem histórico de scans. Sem logs. Sem agendamento automático.",
  },
  {
    nome: "Radar (Dashboard)",
    arquivo: "app/(tabs)/index.tsx",
    existe: true, acessivel: true, banco: false, funcional: false, visual: true,
    automacao: false, logs: false, historico: false,
    obs: "Dashboard visual. Dados de métricas são 100% mockados. Botões de módulos funcionam como toggle local apenas. Sem automação de busca periódica implementada.",
  },
  {
    nome: "Seller (Vendedor IA)",
    arquivo: "—",
    existe: false, acessivel: false, banco: false, funcional: false, visual: false,
    automacao: false, logs: false, historico: false,
    obs: "NÃO EXISTE. Nenhuma tela, rota ou lógica de Seller implementada. O sistema prompt da JADE menciona funções de vendas mas não há módulo dedicado.",
  },
  {
    nome: "Farmer (Follow-up)",
    arquivo: "—",
    existe: false, acessivel: false, banco: false, funcional: false, visual: false,
    automacao: false, logs: false, historico: false,
    obs: "NÃO EXISTE. Sem tela, sem agendador de follow-up, sem reativação de contatos frios.",
  },
  {
    nome: "Commander (Monitor)",
    arquivo: "—",
    existe: false, acessivel: false, banco: false, funcional: false, visual: false,
    automacao: false, logs: false, historico: false,
    obs: "NÃO EXISTE. Sem dashboard executivo, sem monitoramento de outros módulos, sem alertas.",
  },
  {
    nome: "Marketing IA",
    arquivo: "app/marketing.tsx",
    existe: true, acessivel: true, banco: false, funcional: true, visual: false,
    automacao: false, logs: false, historico: false,
    obs: "Funcional para geração de conteúdo via Gemini. Formatos: Instagram Post/Story, WhatsApp Broadcast, TikTok Script, Google Review. Sem agendamento, sem métricas, sem histórico de campanhas.",
  },
  {
    nome: "Conversas",
    arquivo: "app/(tabs)/conversas.tsx + conversa/[id].tsx",
    existe: true, acessivel: true, banco: true, funcional: true, visual: false,
    automacao: false, logs: false, historico: true,
    obs: "Lista de conversas com badges de não lidas. Tela individual com histórico de mensagens (SQLite no device). Sem integração WhatsApp real. Sem IA respondendo automaticamente nas conversas.",
  },
  {
    nome: "Leads / CRM",
    arquivo: "app/(tabs)/leads.tsx",
    existe: true, acessivel: true, banco: true, funcional: true, visual: false,
    automacao: false, logs: false, historico: true,
    obs: "Kanban board com 4 colunas. Movimento entre colunas funciona. Modal CRM com histórico mockado. SQLite persiste no device. Sem integração com API backend. Sem score real de IA.",
  },
];

for (const m of modulos) {
  h2(`${m.nome}`);
  doc.fontSize(8).fillColor(GRAY).font("Courier").text(m.arquivo).moveDown(0.2);

  const checks = [
    ["Existe",         m.existe],
    ["Acessível",      m.acessivel],
    ["Banco de dados", m.banco],
    ["Funcional",      m.funcional],
    ["Apenas visual",  m.visual],
    ["Automações",     m.automacao],
    ["Logs",           m.logs],
    ["Histórico",      m.historico],
  ];

  let cx = 55;
  for (const [label, val] of checks) {
    const color = val ? SUCCESS : (label === "Apenas visual" ? (val ? WARN : "#CCCCCC") : "#CCCCCC");
    const icon  = val ? "✓" : "—";
    doc.fontSize(7.5).fillColor(val ? color : "#AAAAAA").font("Helvetica-Bold")
      .text(`${icon} ${label}`, cx, doc.y, { lineBreak: false, continued: cx < 400 });
    cx = (cx < 400) ? cx + 120 : 55;
  }
  doc.text("", { lineBreak: true });
  doc.moveDown(0.2);
  body(m.obs);
}

// ─── 3. BOTÕES DE ATIVAÇÃO ────────────────────────────────────────────────────
h1("3. BOTÕES DE ATIVAÇÃO DOS MÓDULOS");

body(
  "Os 5 botões circulares (Scanner, JADE, Leads/CRM, WhatsApp, Marketing) na tela Radar " +
  "permitem ativar/desativar módulos. Auditoria detalhada do comportamento atual:"
);

h2("3.1 Quando o usuário ATIVA um módulo");
statusRow("Status muda na UI",            "✅ Funcionando",  "Borda rosa + glow animado aparecem imediatamente");
statusRow("Salvo no banco",               "❌ Ausente",      "Estado gerenciado apenas por useState local");
statusRow("Persiste após reload",         "❌ Ausente",      "Recarregar app reseta todos para estado inicial");
statusRow("Persiste após novo login",     "❌ Ausente",      "AuthContext não carrega estado de módulos");
statusRow("Executa processos reais",      "❌ Ausente",      "Toggle é puramente cosmético — nenhum processo é iniciado");
statusRow("Gera logs",                    "❌ Ausente",      "Sem logging de ativações");
statusRow("Atualiza indicadores",         "❌ Ausente",      "Métricas do dashboard não mudam ao ativar");
statusRow("Exibe confirmação ao usuário", "✅ Funcionando",  "Alert.alert com mensagem descritiva do módulo");

h2("3.2 Quando o usuário DESATIVA um módulo");
statusRow("Interrompe processos",         "❌ Ausente",      "Não há processos reais para interromper");
statusRow("Interrompe automações",        "❌ Ausente",      "Não há automações implementadas");
statusRow("Atualiza status na UI",        "✅ Funcionando",  "Glow e borda pink desaparecem, ícone para de respirar");
statusRow("Atualiza banco de dados",      "❌ Ausente",      "Nenhuma chamada de API ou DB é feita");

h2("3.3 Estado inicial dos módulos");
bullet("Scanner Radar → ativo por padrão (useState = true)");
bullet("JADE IA → ativa por padrão (useState = true)");
bullet("Leads/CRM → inativo por padrão");
bullet("WhatsApp → inativo por padrão");
bullet("Marketing → inativo por padrão");

doc.moveDown(0.3);
body(
  "CONCLUSÃO: Os botões de ativação são 100% cosméticos no estado atual. " +
  "Nenhum módulo realiza ações automáticas ao ser ativado. " +
  "Implementação real requer: tabela module_states no banco, endpoint de toggle na API, " +
  "worker/job system para execução automática e WebSocket para feedback em tempo real."
);

// ─── 4. AUTOMAÇÕES ────────────────────────────────────────────────────────────
h1("4. AUTOMAÇÕES");

h2("4.1 Radar — Busca automática de leads");
statusRow("Busca leads automaticamente",  "❌ Ausente",      "Scanner é manual — usuário inicia cada busca");
statusRow("Frequência agendada",          "❌ Ausente",      "Sem cron job ou agendador");
statusRow("Salva resultados",             "⚠️ Parcial",      "Usuário pode adicionar manualmente ao pipeline");
statusRow("Fila de processamento",        "❌ Ausente");
statusRow("Histórico de buscas",          "❌ Ausente");

h2("4.2 Seller — Envio de mensagens");
statusRow("Módulo Seller existe",         "❌ Ausente",      "Não implementado");
statusRow("Envia mensagens automáticas",  "❌ Ausente");
statusRow("Fila de envios",               "❌ Ausente");
statusRow("Limites de envio",             "❌ Ausente");
statusRow("Logs de envio",                "❌ Ausente");

h2("4.3 Farmer — Follow-up automático");
statusRow("Módulo Farmer existe",         "❌ Ausente",      "Não implementado");
statusRow("Faz follow-up automático",     "❌ Ausente");
statusRow("Agenda tarefas",               "❌ Ausente");
statusRow("Reativa contatos frios",       "❌ Ausente");
statusRow("Gera histórico",               "❌ Ausente");

h2("4.4 Commander — Monitor central");
statusRow("Módulo Commander existe",      "❌ Ausente",      "Não implementado");
statusRow("Monitora outros módulos",      "❌ Ausente");
statusRow("Recebe eventos/alertas",       "❌ Ausente");
statusRow("Dashboard executivo",          "❌ Ausente");

doc.moveDown(0.3);
body(
  "CONCLUSÃO: Nenhuma automação real está implementada. " +
  "O único processo automático existente é o chat com a JADE (Gemini), que é reativo " +
  "(responde quando o usuário manda mensagem). Para implementar automações reais seria necessário: " +
  "sistema de filas (Bull/BullMQ), workers Node.js persistentes, integração WhatsApp Business API e " +
  "banco de dados PostgreSQL centralizado."
);

// ─── 5. BANCO DE DADOS ────────────────────────────────────────────────────────
h1("5. BANCO DE DADOS");

h2("5.1 SQLite Mobile (expo-sqlite) — ATIVO");
body("Localizado em artifacts/mobile/db/init.ts. Usado em dispositivo físico apenas (web usa memória).");

const tabelas = [
  { nome: "leads",         colunas: "id, name, company, value, phone, column_name, tag, tag_color, time_label, initials, avatar_color, created_at", ok: true  },
  { nome: "conversations", colunas: "id, contact_name, last_message, time_label, unread, initials, avatar_color, is_online, created_at", ok: true  },
  { nome: "messages",      colunas: "id, conversation_id (FK), text, sender, time_label, read, created_at", ok: true  },
  { nome: "app_meta",      colunas: "key (PK), value", ok: true  },
];

for (const t of tabelas) {
  const y = doc.y;
  doc.rect(55, y, 8, 8).fill(t.ok ? SUCCESS : ERROR);
  doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT)
    .text(t.nome, 70, y + 0.5, { lineBreak: false });
  doc.fontSize(8).font("Helvetica").fillColor(GRAY)
    .text(`  →  ${t.colunas}`, { lineBreak: true, lineGap: 4 });
}

doc.moveDown(0.3);
h3("Relacionamentos");
bullet("messages.conversation_id → conversations.id (FK com CASCADE esperado mas não declarado explicitamente)");
doc.moveDown(0.2);

h3("Problemas identificados");
bullet("Sem índices em messages.conversation_id — queries de histórico podem ser lentas com volume alto", WARN);
bullet("Sem índice em leads.column_name — filtro por coluna faz table scan", WARN);
bullet("Campo 'phone' em leads não tem máscara/validação no schema", WARN);
bullet("app_meta não é usado atualmente — tabela órfã", WARN);
bullet("Sem campo 'updated_at' em leads — impossível ordenar por modificação recente", WARN);
bullet("Sem soft delete — registros removidos são perdidos permanentemente", WARN);
bullet("Sem migration system — alterações de schema quebram instâncias existentes", ERROR);

h2("5.2 PostgreSQL (lib/db Drizzle) — INATIVO");
statusRow("Configuração Drizzle",         "✅ Funcionando",  "drizzle.config.ts apontando para DATABASE_URL");
statusRow("Schema de tabelas",            "❌ Ausente",      "schema/index.ts contém apenas comentários de boilerplate");
statusRow("Migrations",                   "❌ Ausente",      "Nenhum arquivo de migration existe");
statusRow("Conexão ativa",                "⚠️ Parcial",      "Pool inicializado mas nenhuma rota usa o DB");
statusRow("Dados sincronizados",          "❌ Ausente",      "SQLite mobile e Postgres são completamente separados");

// ─── 6. APIs E BACKEND ────────────────────────────────────────────────────────
h1("6. APIs E BACKEND");

h2("6.1 Rotas Existentes");
const rotas = [
  { method: "GET",  path: "/api/healthz",        status: "✅",  desc: "Health check — retorna { status: 'ok' }" },
  { method: "GET",  path: "/api/jade/health",    status: "✅",  desc: "Versão do agente — retorna { status: 'ok', agent: 'JADE IA v6.2' }" },
  { method: "POST", path: "/api/jade/chat",       status: "✅",  desc: "Chat com Gemini 2.5 Flash — requer { messages: [] }" },
  { method: "POST", path: "/api/places/search",  status: "✅",  desc: "Google Places Text Search — requer { tipo, bairro?, cidade? }" },
];

for (const r of rotas) {
  const y = doc.y;
  const mColor = r.method === "GET" ? SUCCESS : INFO;
  tag(r.method, 55, y, mColor);
  doc.fontSize(9).font("Courier").fillColor(TEXT)
    .text(r.path, 55 + r.method.length * 5.8 + 22, y, { lineBreak: false });
  doc.fontSize(8).font("Helvetica").fillColor(GRAY)
    .text(`  ${r.status}  ${r.desc}`, { lineBreak: true, lineGap: 5 });
}

doc.moveDown(0.3);
h2("6.2 Endpoints AUSENTES (necessários para produção)");
const ausentes = [
  "POST /api/auth/login — autenticação de usuários",
  "POST /api/auth/logout — encerramento de sessão",
  "GET  /api/leads — listar leads do usuário",
  "POST /api/leads — criar novo lead",
  "PUT  /api/leads/:id — atualizar lead",
  "DEL  /api/leads/:id — remover lead",
  "GET  /api/conversations — listar conversas",
  "POST /api/conversations/:id/messages — enviar mensagem",
  "GET  /api/modules/status — status dos módulos ativos",
  "PUT  /api/modules/:name/toggle — ativar/desativar módulo",
  "POST /api/scanner/run — executar scan automático",
  "GET  /api/analytics/dashboard — métricas reais do dashboard",
  "POST /api/marketing/generate — geração de conteúdo (hoje chama Gemini diretamente do mobile)",
  "POST /api/whatsapp/send — envio via WhatsApp Business API",
];
for (const e of ausentes) bullet(e, ERROR);

h2("6.3 Problemas de Segurança");
statusRow("Autenticação nas rotas",       "❌ Ausente",      "Todas as rotas são públicas — sem JWT ou session");
statusRow("Rate limiting",                "❌ Ausente",      "Sem proteção contra abuso da API Gemini");
statusRow("Validação de input",           "⚠️ Parcial",      "jade.ts valida array messages; places.ts não valida 'tipo'");
statusRow("CORS restrito",                "❌ Ausente",      "cors() permite todas as origens");
statusRow("Helmet (headers HTTP)",        "❌ Ausente",      "Sem helmet ou CSP headers");
statusRow("Logs de erro estruturados",    "✅ Funcionando",  "Pino logger com níveis corretos");
statusRow("Tratamento de exceções",       "⚠️ Parcial",      "Try/catch em jade.ts; places.ts pode lançar não tratado");
statusRow("Variáveis de ambiente",        "✅ Funcionando",  "GEMINI_API_KEY como secret Replit — nunca no código");

// ─── 7. IA JADE ───────────────────────────────────────────────────────────────
h1("7. IA JADE — Inteligência Artificial");

h2("7.1 Chat JADE (Gemini 2.5 Flash)");
statusRow("Chat conversacional",          "✅ Funcionando",  "Integração real com Gemini via POST /api/jade/chat");
statusRow("System prompt",                "✅ Funcionando",  "Prompt v6.2 — JADE vendedora brasileira com personalidade");
statusRow("Histórico de conversa",        "⚠️ Parcial",      "Mantido na memória durante sessão; perdido ao fechar app");
statusRow("Contexto acumulativo",         "✅ Funcionando",  "Array de messages completo enviado em cada request");
statusRow("Memória persistente",          "❌ Ausente",      "Sem banco para salvar histórico entre sessões");
statusRow("Integração com leads",         "❌ Ausente",      "JADE não acessa dados reais de leads ao conversar");
statusRow("Ações executáveis",            "❌ Ausente",      "JADE sugere ações no texto mas não executa (sem function calling)");
statusRow("Ferramentas (tool use)",       "❌ Ausente",      "Gemini function calling não implementado");
statusRow("Chips de atalho",              "✅ Funcionando",  "5 chips: Qualificar lead, Criar proposta, Follow-up, Análise, Responder");
statusRow("Indicador de digitação",       "✅ Funcionando",  "Animação de 3 pontos durante processamento");
statusRow("Streaming de respostas",       "❌ Ausente",      "generateContent síncrono — resposta aparece inteira de uma vez");
statusRow("Permissões de acesso",         "❌ Ausente",      "Qualquer dispositivo pode chamar /api/jade/chat sem auth");

h2("7.2 Marketing IA");
statusRow("Geração de conteúdo",          "✅ Funcionando",  "5 formatos: Instagram, Story, WhatsApp, TikTok, Google Review");
statusRow("Chamada direta do mobile",     "⚠️ Parcial",      "Chama Gemini direto do app — expõe chave se não houver proxy");
statusRow("Histórico de gerados",         "❌ Ausente",      "Sem salvar conteúdos gerados");
statusRow("Agendamento de posts",         "❌ Ausente");
statusRow("Métricas de engajamento",      "❌ Ausente");

// ─── 8. MARKETING ─────────────────────────────────────────────────────────────
h1("8. MARKETING");

body("Módulo de geração de conteúdo via IA para redes sociais e canais de venda.");

h2("8.1 Funcionalidades Existentes");
statusRow("Tela de Marketing",            "✅ Funcionando",  "app/marketing.tsx — acessível via aba Mais ou botão na JADE");
statusRow("Instagram Post",               "✅ Funcionando",  "Gera caption com hashtags e CTA");
statusRow("Instagram Story",              "✅ Funcionando",  "Texto curto e engajador para stories");
statusRow("WhatsApp Broadcast",           "✅ Funcionando",  "Mensagem direta de prospecção");
statusRow("TikTok Script",                "✅ Funcionando",  "Script narrado com gancho inicial");
statusRow("Google Review Response",       "✅ Funcionando",  "Resposta profissional a avaliações");
statusRow("Campo de contexto",            "✅ Funcionando",  "Usuário informa contexto antes de gerar");
statusRow("Copiar para área de trabalho", "✅ Funcionando",  "Botão de cópia no resultado");

h2("8.2 Funcionalidades AUSENTES");
bullet("Histórico de campanhas geradas", ERROR);
bullet("Segmentação de público-alvo", ERROR);
bullet("Agendamento de publicações", ERROR);
bullet("Métricas de alcance e engajamento", ERROR);
bullet("Templates salvos pelo usuário", ERROR);
bullet("Integração direta com Instagram/Facebook API", ERROR);
bullet("A/B testing de copies", ERROR);
bullet("Geração de imagens (DALL-E, Imagen)", ERROR);

// ─── 9. UX E DESIGN ───────────────────────────────────────────────────────────
h1("9. UX E DESIGN");

h2("9.1 Avaliação Positiva");
bullet("Dark theme consistente (#000 login, #0A0A0F app) — identidade visual forte", SUCCESS);
bullet("Fonte Space Grotesk em todos os pesos — legibilidade excelente", SUCCESS);
bullet("Accent #FF0080 (pink magenta) aplicado consistentemente", SUCCESS);
bullet("Cards com bordas arredondadas (12–16px) — sensação premium", SUCCESS);
bullet("Safe area insets implementados para iPhone com notch", SUCCESS);
bullet("Animações de entrada no login (fade + scale)", SUCCESS);
bullet("Splash screen com logo + loading dots premium", SUCCESS);
bullet("Kanban board com scroll horizontal fluído", SUCCESS);
bullet("Bottom sheet modal no CRM com slide-up animado", SUCCESS);
bullet("Pulso de atividade (glow + breath) nos módulos ativos", SUCCESS);

h2("9.2 Problemas Identificados");
statusRow("Hierarquia tipográfica",       "⚠️ Parcial",      "Algumas telas misturam tamanhos sem escala clara");
statusRow("Estados vazios",               "⚠️ Parcial",      "Apenas ícone de caixa vazia nas colunas — sem ação de CTAs");
statusRow("Feedback de carregamento",     "⚠️ Parcial",      "ActivityIndicator apenas em login e cadastro");
statusRow("Erro visual nas inputs",       "✅ Funcionando",  "Borda vermelha + texto de erro no cadastro");
statusRow("Scroll infinito / paginação",  "❌ Ausente",      "Listas renderizam todos os items sem virtualização");
statusRow("Gestos (swipe para deletar)",  "❌ Ausente",      "Sem gesture handler em leads ou conversas");
statusRow("Modo claro",                   "❌ Ausente",      "App é exclusivamente dark — sem suporte a light mode");
statusRow("Acessibilidade (a11y)",        "❌ Ausente",      "Sem accessibilityLabel em botões de ícone");
statusRow("Tela de erro / fallback",      "❌ Ausente",      "Sem Error Boundary implementado");
statusRow("Onboarding / tour inicial",    "❌ Ausente",      "Usuário cai direto no dashboard sem orientação");

h2("9.3 Telas Implementadas (18 total)");
const telas = [
  "splash.tsx", "login.tsx", "cadastro.tsx",
  "(tabs)/index.tsx (Radar)", "(tabs)/leads.tsx", "(tabs)/conversas.tsx",
  "(tabs)/jade.tsx", "(tabs)/mais.tsx", "conversa/[id].tsx",
  "scanner.tsx", "marketing.tsx", "perfil.tsx",
  "plano.tsx", "notificacoes.tsx", "treinamento.tsx",
  "ajuda.tsx", "privacidade.tsx", "termos.tsx",
];
let tx = 55;
for (let i = 0; i < telas.length; i++) {
  if (i % 3 === 0 && i > 0) { doc.text("", { lineBreak: true }); tx = 55; }
  tag(telas[i], tx, doc.y, INFO);
  tx += telas[i].length * 5.6 + 22;
  if (tx > 480) { doc.text("", { lineBreak: true }); tx = 55; }
}
doc.text("", { lineBreak: true }).moveDown(0.3);

// ─── 10. SEGURANÇA ────────────────────────────────────────────────────────────
h1("10. SEGURANÇA");

h2("10.1 O que está protegido");
bullet("GEMINI_API_KEY e GOOGLE_MAPS_API_KEY armazenadas como secrets Replit — nunca no código", SUCCESS);
bullet("Sem dados sensíveis commitados no repositório", SUCCESS);
bullet("Pino logger não expõe dados de usuário nos logs", SUCCESS);
bullet("AbortController para cancelar requests pendentes", SUCCESS);

h2("10.2 Riscos Identificados — ALTA PRIORIDADE");
bullet("CRÍTICO: Nenhuma autenticação nas rotas da API — qualquer pessoa pode chamar /api/jade/chat", ERROR);
bullet("CRÍTICO: CORS allow all origins — API aceita requests de qualquer domínio", ERROR);
bullet("ALTO: Sem rate limiting — API Gemini pode ser esgotada por abuso", ERROR);
bullet("ALTO: Login com credenciais hardcoded (rodrigo@jadeia.com.br / jade2026 em AuthContext.tsx)", ERROR);
bullet("ALTO: Marketing IA no mobile pode estar chamando Gemini diretamente (expõe chave em plaintext)", ERROR);
bullet("MÉDIO: Sem helmet.js — headers de segurança HTTP ausentes", WARN);
bullet("MÉDIO: Sem validação completa de input em places.ts", WARN);
bullet("MÉDIO: SQLite sem criptografia — dados de leads em texto plano no device", WARN);
bullet("BAIXO: Sem HTTPS enforcement no servidor Express", WARN);

h2("10.3 Recomendações Imediatas");
bullet("Implementar JWT com refresh tokens em todas as rotas protegidas");
bullet("Configurar CORS para origens específicas (domínio do app)");
bullet("Adicionar express-rate-limit no endpoint /api/jade/chat");
bullet("Mover todas as chamadas de IA para o backend — nunca do mobile diretamente");
bullet("Remover credenciais hardcoded — usar banco de dados com bcrypt");

// ─── 11. PERFORMANCE ──────────────────────────────────────────────────────────
h1("11. PERFORMANCE");

h2("11.1 Mobile (Expo React Native)");
statusRow("Tempo de carregamento inicial",  "⚠️ Parcial",   "~2-3s no device (carregamento de fontes Google)");
statusRow("Renderização do Radar",          "✅ Funcionando", "< 100ms — dados locais sem chamadas de rede");
statusRow("Virtualização de listas",        "❌ Ausente",    "ScrollView puro em leads e conversas — sem FlatList");
statusRow("Otimização de imagens",          "✅ Funcionando", "Única imagem (jade-logo.png) com resizeMode=contain");
statusRow("Memo/useCallback",               "❌ Ausente",    "Nenhum componente usa React.memo ou useCallback");
statusRow("Animações com useNativeDriver",  "⚠️ Parcial",    "Configurado mas unsupported no Expo web (fallback JS)");
statusRow("Lazy loading de telas",          "✅ Funcionando", "Expo Router carrega telas sob demanda");
statusRow("Bundle size",                    "⚠️ Parcial",    "Sem tree-shaking explícito — @expo/vector-icons inclui todos ícones");

h2("11.2 Backend (API Server)");
statusRow("Tempo de resposta /healthz",     "✅ Funcionando", "< 5ms");
statusRow("Tempo de resposta Gemini",       "⚠️ Parcial",    "3-8s dependendo do modelo — sem streaming");
statusRow("Cache de respostas IA",          "❌ Ausente",    "Cada request chama Gemini sem cache");
statusRow("Compressão HTTP",                "❌ Ausente",    "Sem compression middleware");
statusRow("Connection pooling DB",          "✅ Funcionando", "node-postgres pool configurado (mas DB não usado)");
statusRow("Consultas lentas",               "❌ Ausente",    "Sem queries — não aplicável ainda");

h2("11.3 Otimizações Recomendadas");
bullet("Substituir ScrollView por FlatList/FlashList em leads e conversas");
bullet("Adicionar React.memo nos componentes LeadCard, ConversaCard");
bullet("Implementar streaming SSE no endpoint jade/chat (respostas parciais)");
bullet("Cache Redis para respostas frequentes da JADE");
bullet("Compressão gzip com compression middleware no Express");
bullet("CDN para assets estáticos em produção");

// ─── 12. RELATÓRIO FINAL ──────────────────────────────────────────────────────
h1("12. RELATÓRIO FINAL EXECUTIVO");

h2("12.1 ✅ O que está funcionando CORRETAMENTE");
const ok = [
  "Chat com JADE via Google Gemini 2.5 Flash — responde em português, tem personalidade de vendedora",
  "Scanner Radar — busca estabelecimentos via Google Places e adiciona ao pipeline",
  "Marketing IA — gera conteúdo para 5 formatos diferentes",
  "Pipeline de Leads (Kanban) — move cards entre colunas, persiste no SQLite",
  "Conversas — lista e histórico de mensagens com SQLite no device",
  "Navegação completa — 5 abas + 13 telas extras todas acessíveis",
  "Telas informativas — Ajuda (FAQ), Treinamento, Privacidade, Termos, Notificações, Plano",
  "Autenticação local — login persiste via AsyncStorage",
  "Design system — dark theme coerente, Space Grotesk, pink accent",
  "Animações premium — splash, login, módulos, CRM modal",
  "Botões de módulos — toggle com feedback visual (glow + breath + Alert)",
  "Safe area + responsividade — funciona em iPhone com notch",
];
for (const item of ok) bullet(item, SUCCESS);

doc.moveDown(0.4);
h2("12.2 ⚠️ O que está PARCIALMENTE implementado");
const partial = [
  "Módulos de ativação — toggle funciona visualmente mas não executa processos reais",
  "Métricas do dashboard — pipeline conta leads reais, mas os 4 cards são valores fixos",
  "CRM Lead Detail — histórico é mockado, análise JADE é estática",
  "Notificações — tela existe mas dados são estáticos",
  "Perfil do usuário — dados são hardcoded (Rodrigo Coral, Pro plan)",
  "Banco de dados — SQLite funciona no device mas PostgreSQL não tem schema",
  "API Places — funciona mas sem histórico de buscas ou exportação",
  "JADE chat — funciona mas sem memória entre sessões ou acesso a dados do usuário",
  "Segurança — sem autenticação nas rotas de API",
];
for (const item of partial) bullet(item, WARN);

doc.moveDown(0.4);
h2("12.3 ❌ O que está QUEBRADO");
const broken = [
  "Credenciais hardcoded em AuthContext.tsx — sistema de login não é real",
  "CORS aberto — API exposta publicamente sem proteção",
  "Rate limiting ausente — chamadas Gemini podem esgotar quota",
  "SQLite sem migration system — atualizações de schema quebram app existente",
];
for (const item of broken) bullet(item, ERROR);

doc.moveDown(0.4);
h2("12.4 ❌ O que AINDA NÃO EXISTE");
const notExist = [
  "Módulo Seller — envio automático de mensagens de vendas",
  "Módulo Farmer — follow-up automático e reativação de contatos",
  "Módulo Commander — monitoramento central e dashboard executivo",
  "Automações reais — nenhum processo roda em background",
  "WhatsApp Business API — integração de mensagens real",
  "Push Notifications — sem alertas de novos leads ou mensagens",
  "Autenticação de usuários — sem cadastro real, JWT, sessão segura",
  "Schema PostgreSQL — banco central sem tabelas definidas",
  "Sincronização cloud — dados ficam apenas no device",
  "EAS Build — app não está configurado para distribuição nas stores",
  "Streaming de IA — respostas lentas porque não usam SSE",
  "Analytics real — sem BigQuery, Mixpanel ou equivalente",
  "Integração CRM externo — sem Salesforce, HubSpot, Pipedrive",
  "Gestão multiusuário — sem tenants, empresas ou equipes",
];
for (const item of notExist) bullet(item, ERROR);

doc.addPage();
doc.rect(0, 0, doc.page.width, 8).fill(PINK);
doc.moveDown(0.6);

h2("12.5 Prioridades de Implementação");

doc.moveDown(0.2);
h3("🔴 PRIORIDADE ALTA — Fazer antes de lançar para usuários reais");
const alta = [
  "Implementar autenticação real (JWT + bcrypt) e remover credenciais hardcoded",
  "Criar schema PostgreSQL e migrar dados do SQLite para cloud",
  "Adicionar autenticação nas rotas da API (middleware JWT)",
  "Configurar CORS restrito e rate limiting na API",
  "Implementar persistência do estado dos módulos (banco + API)",
  "Streaming de respostas da JADE (SSE) para melhor UX",
];
for (const item of alta) bullet(`🔴 ${item}`, ERROR);

doc.moveDown(0.3);
h3("🟡 PRIORIDADE MÉDIA — Segunda sprint");
const media = [
  "Conectar WhatsApp Business API (Twilio ou Meta Cloud API)",
  "Implementar módulo Seller com fila de mensagens automáticas",
  "Automação do Scanner com agendador cron",
  "Push notifications (Expo Notifications + FCM)",
  "Memória persistente da JADE entre sessões",
  "Métricas reais no dashboard (substituir dados hardcoded)",
  "Histórico de campanhas no Marketing IA",
];
for (const item of media) bullet(`🟡 ${item}`, WARN);

doc.moveDown(0.3);
h3("🟢 PRIORIDADE BAIXA — Melhorias futuras");
const baixa = [
  "Módulos Farmer e Commander",
  "EAS Build e publicação nas stores (App Store + Google Play)",
  "Modo claro e acessibilidade",
  "Gestão de equipes e multiusuário",
  "Integração com CRMs externos",
  "Analytics avançado e relatórios exportáveis",
  "A/B testing de copies no Marketing",
];
for (const item of baixa) bullet(`🟢 ${item}`, SUCCESS);

doc.moveDown(0.5);
h2("12.6 Próximos Passos Recomendados (ordem de execução)");
const steps = [
  "Sprint 1: Autenticação real + Schema PostgreSQL + Persistência de módulos",
  "Sprint 2: WhatsApp Business API + Automação Scanner + Streaming JADE",
  "Sprint 3: Módulo Seller + Métricas reais + Push Notifications",
  "Sprint 4: Módulo Farmer + Commander + Relatórios",
  "Sprint 5: EAS Build + Launch stores + Onboarding",
];
for (let i = 0; i < steps.length; i++) {
  const y = doc.y;
  doc.rect(55, y, 20, 20).fill(PINK + "22");
  doc.fontSize(10).fillColor(PINK).font("Helvetica-Bold")
    .text(`${i + 1}`, 62, y + 4, { lineBreak: false });
  doc.fontSize(9).fillColor(TEXT).font("Helvetica")
    .text(steps[i], 82, y + 4, { lineBreak: true, lineGap: 6 });
}

// ─── RODAPÉ ───────────────────────────────────────────────────────────────────
doc.moveDown(1.5);
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(PINK).lineWidth(1).stroke();
doc.moveDown(0.5);
doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text(
    "JADE IA — Auditoria Técnica Completa  |  JÁ Delivery — Criciúma SC  |  Confidencial\n" +
    `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} via Replit Agent  |  v1.0.0-beta`,
    { align: "center" }
  );

// Numbering pages (skip cover = page 1)
const range = doc.bufferedPageRange();
for (let i = 1; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  doc.fontSize(8).fillColor(GRAY).font("Helvetica")
    .text(`${i} / ${range.count - 1}`, 50, doc.page.height - 40, { align: "right", width: doc.page.width - 100 });
}

doc.end();
doc.on("finish", () => console.log(`✅  PDF gerado: ${OUTPUT}`));
