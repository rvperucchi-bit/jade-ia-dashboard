const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "exports", "mapa-navegacao-apis-jade-2026-06-24.pdf");

const C = {
  bg: "#0B0913",
  card: "#15121F",
  card2: "#1A1626",
  border: "#262130",
  pink: "#FF0080",
  purple: "#8400FF",
  white: "#FFFFFF",
  text: "#E6E2F0",
  muted: "#8A8398",
  green: "#00D68F",
  orange: "#FF9F0A",
  red: "#FF453A",
  blue: "#4DA3FF",
};

// ---------- DATA ----------
const ENTRY_FLOW = [
  ["Splash", "->", "verifica token: logado -> app · senão -> Login"],
  ["Login", "->", "sucesso -> (tabs)/JADE · 'Criar conta' -> Cadastro"],
  ["Cadastro", "->", "POST /api/auth/register · Termos · Privacidade · volta p/ Login"],
  ["Onboarding", "->", "ao concluir -> (tabs)/JADE"],
  ["(tabs) / Mais", "->", "ambos redirecionam para (tabs)/JADE (tela inicial)"],
];

const DRAWER = [
  { title: "Conversas", items: [["Nova conversa", "ação interna"], ["Histórico", "/historico"]] },
  { title: "Comercial", items: [["Dashboard", "/painelexecutivo"], ["Conversas", "/(tabs)/conversas"], ["CRM", "/crm"], ["Pipeline", "/pipeline"], ["Oportunidades", "/(tabs)/leads"], ["Briefings", "/briefing"], ["Relatórios", "/relatorios"]] },
  { title: "Marketing", items: [["Briefings", "/briefing"], ["Campanhas", "/marketing"], ["Planejamento", "/planejamento"], ["Simulação", "/roleplay"]] },
  { title: "Gestão", items: [["Central Comercial", "/painelexecutivo"], ["Meu Time", "/meutime"], ["Metas & KPIs", "/metas"], ["Ranking", "/relatoriogestor"], ["Carteira", "/carteira"], ["Gestão Inteligente", "/gestao"], ["Feedback JADE", "/feedbackjade"], ["Análise Estratégica", "/analise"], ["Relatório do Gestor", "/relatoriogestor"], ["Notificações", "/notificacoes"]] },
  { title: "Operação", items: [["Scanner", "/scanner"], ["Rotas", "/criarrota"], ["Laudo", "/laudo"]] },
  { title: "Configurações", items: [["Minha Empresa", "/empresa"], ["Perfil", "/perfil"], ["Plano", "/plano"], ["Uso", "/uso"], ["Integrações", "/whatsapp-config"]] },
];

const SHORTCUTS = [
  ["JADE (chat)", "Cabeçalho menu abre menu lateral · avatar -> /perfil · sair -> /login"],
  ["JADE (chat)", "Banner de créditos -> /loja · handoff de lead -> /leads"],
  ["Conversas", "toque numa conversa -> /conversa/:id"],
  ["Leads", "abrir conversa -> /conversas"],
  ["Painel executivo", "card de leads -> /crm"],
  ["Uso", "-> /plano · -> /loja (créditos de busca e de mensagens)"],
  ["Scanner", "limite atingido -> /loja (mensagens)"],
  ["Loja", "assinar plano -> /plano"],
];

const API_BASE = "/api";
const API = [
  { mount: "", title: "Health", color: C.green, eps: [["GET", "/healthz"]] },
  { mount: "/auth", title: "Autenticação", color: C.pink, eps: [["POST", "/login"], ["POST", "/register"], ["POST", "/logout"]] },
  { mount: "/jade", title: "JADE (assistente)", color: C.purple, eps: [["POST", "/chat"], ["POST", "/prospectar"], ["GET", "/status"], ["POST", "/status"], ["GET", "/autonomo"], ["POST", "/autonomo"], ["GET", "/health"], ["GET", "/sessions"], ["POST", "/sessions"], ["GET", "/sessions/:id"], ["DELETE", "/sessions/:id"], ["GET", "/crm"], ["POST", "/crm"], ["PATCH", "/crm/:id"], ["POST", "/approach"], ["POST", "/transcribe"]] },
  { mount: "/places", title: "Lugares / Prospecção", color: C.blue, eps: [["POST", "/radar"], ["POST", "/search"]] },
  { mount: "/modules", title: "Módulos", color: C.orange, eps: [["GET", "/status"], ["GET", "/:name/status"], ["PUT", "/:name/toggle"], ["POST", "/:name/toggle"], ["POST", "/:name/run"], ["GET", "/:name/logs"], ["GET", "/scanner/history"]] },
  { mount: "/analytics", title: "Analytics", color: C.green, eps: [["GET", "/dashboard"]] },
  { mount: "/marketing", title: "Marketing", color: C.pink, eps: [["POST", "/generate"], ["GET", "/campaigns"], ["GET", "/campaigns/:id"]] },
  { mount: "/activity", title: "Atividades", color: C.blue, eps: [["GET", "/"], ["POST", "/"]] },
  { mount: "/empresa", title: "Empresa", color: C.purple, eps: [["GET", "/"], ["POST", "/"]] },
  { mount: "/relatorios", title: "Relatórios", color: C.green, eps: [["GET", "/diario"], ["GET", "/semanal"]] },
  { mount: "/time", title: "Time / Colaboradores", color: C.orange, eps: [["GET", "/"], ["POST", "/"], ["GET", "/:id"], ["PUT", "/:id"]] },
  { mount: "/carteira", title: "Carteira", color: C.blue, eps: [["GET", "/"], ["POST", "/"], ["POST", "/:id/visita"]] },
  { mount: "/metas", title: "Metas", color: C.green, eps: [["GET", "/"], ["PUT", "/:vendedorId"]] },
  { mount: "/feedback", title: "Feedback", color: C.pink, eps: [["POST", "/gerar"], ["GET", "/executivo"], ["POST", "/executivo"]] },
  { mount: "/dashboard", title: "Dashboard do gestor", color: C.green, eps: [["GET", "/gestor"]] },
  { mount: "/planejamento", title: "Planejamento", color: C.purple, eps: [["GET", "/:userId/hoje"], ["POST", "/:userId/hoje"]] },
  { mount: "/notificacoes", title: "Notificações", color: C.orange, eps: [["GET", "/"], ["POST", "/time"]] },
  { mount: "/stripe", title: "Stripe (pagamentos)", color: C.pink, eps: [["POST", "/create-checkout"], ["POST", "/webhook"], ["POST", "/create-checkout-searches"], ["POST", "/create-checkout-messages"], ["GET", "/callback-messages"], ["GET", "/callback-searches"], ["GET", "/subscription/:email"]] },
  { mount: "/whatsapp", title: "WhatsApp", color: C.green, eps: [["GET", "/webhook"], ["POST", "/webhook"], ["POST", "/send"]] },
];

const METHOD_COLOR = { GET: C.green, POST: C.pink, PUT: C.purple, PATCH: C.orange, DELETE: C.red };

// ---------- RENDER ----------
const doc = new PDFDocument({ size: "A4", margin: 0 });
doc.pipe(fs.createWriteStream(OUT));
const PW = doc.page.width, PH = doc.page.height, MX = 44, CW = PW - MX * 2;
let pageNo = 0, y = 0;

const bg = () => doc.rect(0, 0, PW, PH).fill(C.bg);
function footer() {
  pageNo++;
  doc.fontSize(8).fillColor(C.muted).font("Helvetica");
  doc.text("JADE IA — Mapa de navegação & APIs", MX, PH - 30, { width: CW / 2 });
  doc.text(`Página ${pageNo}`, MX + CW / 2, PH - 30, { width: CW / 2, align: "right" });
}
function np() { doc.addPage(); bg(); y = 52; }
function ensure(h) { if (y + h > PH - 50) { footer(); np(); } }

function h2(label, color) {
  ensure(38);
  doc.roundedRect(MX, y, 4, 18, 2).fill(color);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.white).text(label, MX + 14, y + 2, { characterSpacing: 0.5 });
  y += 30;
}

function methodBadge(x, yy, m) {
  const w = 46;
  doc.roundedRect(x, yy, w, 15, 4).fill(METHOD_COLOR[m] || C.muted);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#0B0913").text(m, x, yy + 4, { width: w, align: "center" });
  return w;
}

// ----- COVER -----
bg();
doc.rect(0, 0, PW, 6).fill(C.pink);
doc.rect(0, 6, PW, 2).fill(C.purple);
y = 64;
doc.font("Helvetica-Bold").fontSize(13).fillColor(C.pink).text("JADE IA", MX, y, { characterSpacing: 3 });
y += 38;
doc.font("Helvetica-Bold").fontSize(28).fillColor(C.white).text("Mapa de Navegação & APIs", MX, y);
y += 38;
doc.font("Helvetica").fontSize(12).fillColor(C.muted).text("Caminhos dos botões entre telas + endpoints da API já implementados", MX, y);
y += 20;
doc.font("Helvetica").fontSize(10).fillColor(C.muted).text("24 de junho de 2026", MX, y);
y += 34;

const stats = [
  { n: "43", l: "telas" },
  { n: "6", l: "grupos no menu" },
  { n: String(API.reduce((a, g) => a + g.eps.length, 0)), l: "endpoints" },
  { n: String(API.length), l: "módulos de API" },
];
const gp = 12, sw = (CW - gp * 3) / 4;
stats.forEach((s, i) => {
  const x = MX + i * (sw + gp);
  doc.roundedRect(x, y, sw, 60, 10).fillAndStroke(C.card, C.border);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.pink).text(s.n, x, y + 11, { width: sw, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(s.l, x, y + 40, { width: sw, align: "center" });
});
y += 60 + 28;

// ----- 1. ENTRY FLOW -----
h2("1 · Fluxo de entrada", C.pink);
ENTRY_FLOW.forEach(([from, , to]) => {
  doc.font("Helvetica").fontSize(9.5);
  const tw = CW - 150 - 14;
  const th = doc.heightOfString(to, { width: tw });
  const rh = Math.max(30, th + 16);
  ensure(rh + 6);
  doc.roundedRect(MX, y, CW, rh, 8).fillAndStroke(C.card, C.border);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white).text(from, MX + 14, y + 9, { width: 140 });
  doc.font("Helvetica").fontSize(9.5).fillColor(C.text).text(to, MX + 150, y + 9, { width: tw });
  y += rh + 6;
});
y += 10;

// ----- 2. NAV HUB (drawer) -----
h2("2 · Menu lateral da JADE (menu) — hub de navegação", C.purple);
doc.font("Helvetica").fontSize(9).fillColor(C.muted);
ensure(16);
doc.text("Aberto pelo ícone menu no topo do chat. Cada item leva direto à tela indicada.", MX, y, { width: CW });
y += 22;

DRAWER.forEach((grp) => {
  const lineH = 14;
  const headH = 24;
  const boxH = headH + grp.items.length * lineH + 12;
  ensure(boxH + 8);
  doc.roundedRect(MX, y, CW, boxH, 10).fillAndStroke(C.card, C.border);
  doc.roundedRect(MX + 14, y + 12, 4, 12, 2).fill(C.purple);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.white).text(grp.title, MX + 26, y + 11);
  let iy = y + headH + 6;
  grp.items.forEach(([label, route]) => {
    doc.font("Helvetica").fontSize(9).fillColor(C.text).text(label, MX + 26, iy, { width: 180 });
    doc.font("Helvetica").fontSize(9).fillColor(route.startsWith("/") ? C.pink : C.muted)
      .text(route, MX + 210, iy, { width: CW - 210 - 16 });
    iy += lineH;
  });
  y += boxH + 8;
});
y += 6;

// ----- 3. SHORTCUTS -----
h2("3 · Atalhos diretos entre telas", C.pink);
SHORTCUTS.forEach(([from, to]) => {
  doc.font("Helvetica").fontSize(9.5);
  const tw = CW - 130 - 14;
  const th = doc.heightOfString(to, { width: tw });
  const rh = Math.max(28, th + 14);
  ensure(rh + 6);
  doc.roundedRect(MX, y, CW, rh, 8).fillAndStroke(C.card, C.border);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.white).text(from, MX + 14, y + 8, { width: 120 });
  doc.font("Helvetica").fontSize(9.5).fillColor(C.text).text(to, MX + 130, y + 8, { width: tw });
  y += rh + 6;
});

// ----- 4. APIs -----
footer(); np();
h2("4 · APIs já implementadas", C.green);
doc.font("Helvetica").fontSize(9).fillColor(C.muted);
ensure(16);
doc.text(`Base: ${API_BASE}  ·  método + caminho relativo ao módulo`, MX, y, { width: CW });
y += 22;

API.forEach((g) => {
  const rows = g.eps.length;
  const rowH = 18;
  const headH = 26;
  const boxH = headH + rows * rowH + 10;
  ensure(boxH + 8);
  doc.roundedRect(MX, y, CW, boxH, 10).fillAndStroke(C.card, C.border);
  doc.roundedRect(MX + 14, y + 11, 4, 13, 2).fill(g.color);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.white)
    .text(`${g.title}`, MX + 26, y + 10, { continued: true })
    .font("Helvetica").fontSize(9).fillColor(C.muted).text(`   ${API_BASE}${g.mount}`);
  let iy = y + headH + 4;
  g.eps.forEach(([m, p]) => {
    methodBadge(MX + 26, iy, m);
    doc.font("Courier").fontSize(9.5).fillColor(C.text).text(`${API_BASE}${g.mount}${p === "/" ? "" : p}` || "/", MX + 82, iy + 3, { width: CW - 82 - 16 });
    iy += rowH;
  });
  y += boxH + 8;
});

footer();
doc.end();
console.log("PDF gerado:", OUT);
