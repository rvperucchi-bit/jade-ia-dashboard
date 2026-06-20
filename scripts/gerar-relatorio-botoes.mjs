import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.resolve("relatorio-botoes.pdf");

const doc = new PDFDocument({ margin: 50, size: "A4" });
doc.pipe(fs.createWriteStream(OUT));

// ── Cores ──────────────────────────────────────────────
const PINK   = "#FF0080";
const GREEN  = "#00C97A";
const YELLOW = "#FFB300";
const DARK   = "#0A0A0F";
const GRAY   = "#AAAACC";
const WHITE  = "#FFFFFF";
const CARD_BG = "#111118";

// ── Helpers ────────────────────────────────────────────
function rect(x, y, w, h, color, radius = 6) {
  doc.save().roundedRect(x, y, w, h, radius).fill(color).restore();
}

function badge(x, y, text, bg, fg = "#fff") {
  const W = doc.widthOfString(text) + 16;
  const H = 18;
  rect(x, y, W, H, bg, 4);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(fg).text(text, x + 8, y + 4, { lineBreak: false });
  return W;
}

function sectionTitle(text) {
  doc.moveDown(0.6);
  const y = doc.y;
  rect(50, y, 495, 28, PINK, 6);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(WHITE).text(text, 62, y + 7);
  doc.moveDown(1.6);
}

function row(tela, botao, api, metodo, status, obs, isShaded) {
  const startY = doc.y;
  const ROW_H  = 48;

  if (startY + ROW_H > doc.page.height - 80) {
    doc.addPage();
  }

  const y = doc.y;
  const bgColor = isShaded ? "#16161F" : "#111118";
  rect(50, y, 495, ROW_H, bgColor, 4);

  // Status badge
  const statusColor = status === "✅" ? GREEN : status === "⚠️" ? YELLOW : "#FF3B5C";
  badge(56, y + 6, status === "✅" ? " OK " : status === "⚠️" ? "PARCIAL" : " FALHA ", statusColor);

  // Tela
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(tela, 110, y + 6, { width: 80, lineBreak: false });
  // Botão
  doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text(botao, 110, y + 20, { width: 80 });

  // API
  const apiColor = metodo === "POST" ? "#6C63FF" : metodo === "GET" ? "#4ECDC4" : GRAY;
  if (metodo && metodo !== "—") badge(200, y + 6, metodo, apiColor);
  doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(api, 200, y + 22, { width: 160, lineBreak: false });

  // Obs
  doc.font("Helvetica").fontSize(8).fillColor(status === "⚠️" ? YELLOW : GRAY).text(obs, 368, y + 10, { width: 170 });

  doc.moveDown(0);
  doc.y = y + ROW_H + 3;
}

// ══════════════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════════════
rect(0, 0, doc.page.width, doc.page.height, DARK);

// Gradiente visual simulado
rect(0, 0, doc.page.width, 280, "#0D0D18", 0);
rect(0, 240, doc.page.width, 2, PINK, 0);

doc.font("Helvetica-Bold").fontSize(34).fillColor(WHITE).text("JADE IA", 50, 100, { align: "center" });
doc.font("Helvetica").fontSize(16).fillColor(PINK).text("Relatório de Auditoria de Botões", 50, 148, { align: "center" });
doc.font("Helvetica").fontSize(11).fillColor(GRAY).text(`Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 50, 178, { align: "center" });

// Sumário executivo na capa
rect(80, 220, 430, 90, "#16161F", 10);
doc.font("Helvetica-Bold").fontSize(12).fillColor(WHITE).text("Sumário Executivo", 100, 236);
doc.font("Helvetica").fontSize(10).fillColor(GREEN).text("✅  21 botões funcionando corretamente", 100, 256);
doc.font("Helvetica").fontSize(10).fillColor(YELLOW).text("⚠️   3 botões com funcionamento parcial", 100, 272);
doc.font("Helvetica").fontSize(10).fillColor("#FF3B5C").text("❌  0 botões completamente quebrados", 100, 288);

doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Sprint: 5 correções + módulo Enterprise concluídos • Status geral: APROVADO", 80, 330, { align: "center", width: 430 });

doc.addPage();

// ══════════════════════════════════════════════════════════════
// CORPO
// ══════════════════════════════════════════════════════════════
rect(0, 0, doc.page.width, doc.page.height, DARK);

// Header da tabela
doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE);
rect(50, 50, 495, 24, "#1E1E2E", 4);
doc.text("Status", 56, 57, { lineBreak: false });
doc.text("Tela", 110, 57, { lineBreak: false });
doc.text("Endpoint / Ação", 200, 57, { lineBreak: false });
doc.text("Observação", 368, 57, { lineBreak: false });
doc.moveDown(0);
doc.y = 80;

// ── Dados ─────────────────────────────────────────────────────
const BOTOES_OK = [
  ["roteiro.tsx",      "Gerar Roteiro Personalizado",   "/api/jade/chat",          "POST", "✅", "Empresa fetch com fallback seguro"],
  ["briefing.tsx",     "Gerar Briefing",                "/api/jade/chat",          "POST", "✅", "Empresa ctx isolado em try-catch"],
  ["laudo.tsx",        "Gerar Laudo",                   "/api/jade/chat",          "POST", "✅", "3 tipos de análise, com loading"],
  ["relatorios.tsx",   "Gerar Análise do Dia",          "/api/jade/chat",          "POST", "✅", "Diário e Semanal funcionando"],
  ["empresa.tsx",      "Salvar e Treinar JADE",         "/api/empresa (POST)",     "POST", "✅", "Fallback AsyncStorage se API offline"],
  ["marketing.tsx",    "Gerar com JADE (Gerar/Posts)",  "/api/marketing/generate", "POST", "✅", "Histórico salvo, cópia ativa"],
  ["marketing.tsx",    "Criar Estratégia de Mídia",     "/api/jade/chat",          "POST", "✅", "Media Planner novo — 5 seções"],
  ["marketing.tsx",    "Gerar peças avulsas",           "/api/marketing/generate", "POST", "✅", "4 tipos: Google, Meta, CTA, Email"],
  ["plano.tsx",        "Fazer upgrade agora",           "Alert — sem API",         "—",   "✅", "Abre contato comercial@jadeia.com.br"],
  ["conversas.tsx",    "Ativar JADE",                   "Toggle local",            "—",   "✅", "Haptic, visual verde/pink, texto muda"],
  ["scanner.tsx",      "Buscar Estabelecimentos",       "/api/places/search",      "POST", "✅", "Loading + error handling presentes"],
  ["scanner.tsx",      "Usar minha localização",        "expo-location API",       "—",   "✅", "getCurrentPositionAsync com permissão"],
  ["scanner.tsx",      "Abrir no Maps",                 "Deep link nativo",        "—",   "✅", "maps:?q= (iOS) / geo:0,0?q= (Android)"],
  ["scanner.tsx",      "Adicionar ao Pipeline",         "AppContext.addLead()",    "—",   "✅", "Salva no contexto global"],
  ["gestao.tsx",       "Cards do Hub Enterprise",       "router.push(rota)",       "—",   "✅", "6 cards navegam corretamente"],
  ["meutime.tsx",      "Abrir modal Novo Vendedor",     "setShowModal(true)",      "—",   "✅", "Modal abre, campos visíveis"],
  ["metas.tsx",        "Gerar Estratégia do Time",      "/api/jade/chat",          "POST", "✅", "Loading + erro por string"],
  ["carteira.tsx",     "Analisar Carteira (JADE)",      "/api/jade/chat",          "POST", "✅", "Prompt com perfil de clientes"],
  ["feedbackjade.tsx", "Ver feedback (por vendedor)",   "/api/jade/chat",          "POST", "✅", "Loading por ID, feedback individual"],
  ["relatoriogestor",  "Gerar Relatório Executivo",     "/api/jade/chat",          "POST", "✅", "Com loading e exibição na tela"],
  ["relatoriogestor",  "Gerar Estratégia Mês",          "/api/jade/chat",          "POST", "✅", "Prompt com métricas do time"],
];

const BOTOES_PARCIAL = [
  ["meutime.tsx",   "Salvar Vendedor (modal)",     "/api/time",              "POST", "⚠️", "catch{} vazio — erro silencioso ao salvar"],
  ["carteira.tsx",  "Registrar Visita de Encanto", "Estado local apenas",    "—",   "⚠️", "Não chama /api/carteira/:id/visita"],
  ["conversas.tsx", "Ativar JADE (integração)",    "Sem API ainda",          "—",   "⚠️", "Toggle visual — sem WhatsApp real"],
];

sectionTitle("  ✅  BOTÕES FUNCIONANDO  (21 / 24)");

BOTOES_OK.forEach((b, i) => {
  row(b[0], b[1], b[2], b[3], b[4], b[5], i % 2 === 0);
});

doc.addPage();
rect(0, 0, doc.page.width, doc.page.height, DARK);

// Header tabela parcial
rect(50, 50, 495, 24, "#1E1E2E", 4);
doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE);
doc.text("Status", 56, 57, { lineBreak: false });
doc.text("Tela", 110, 57, { lineBreak: false });
doc.text("Endpoint / Ação", 200, 57, { lineBreak: false });
doc.text("Observação", 368, 57, { lineBreak: false });
doc.moveDown(0);
doc.y = 80;

sectionTitle("  ⚠️  FUNCIONAMENTO PARCIAL  (3 / 24)");

BOTOES_PARCIAL.forEach((b, i) => {
  row(b[0], b[1], b[2], b[3], b[4], b[5], i % 2 === 0);
});

// Recomendações
doc.moveDown(1.5);
rect(50, doc.y, 495, 160, "#16161F", 8);
const recY = doc.y + 14;
doc.font("Helvetica-Bold").fontSize(12).fillColor(PINK).text("Recomendações de Correção", 66, recY);
doc.font("Helvetica").fontSize(9.5).fillColor(WHITE);
doc.text("1.  meutime.tsx — Salvar Vendedor:", 66, recY + 20);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("   Adicionar Alert de erro no catch{} para não silenciar falhas de POST /api/time.", 66, recY + 33);
doc.font("Helvetica-Bold").fontSize(9.5).fillColor(WHITE).text("2.  carteira.tsx — Registrar Visita:", 66, recY + 52);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("   Conectar o modal ao endpoint POST /api/carteira/:id/visita além do estado local.", 66, recY + 65);
doc.font("Helvetica-Bold").fontSize(9.5).fillColor(WHITE).text("3.  conversas.tsx — Ativar JADE:", 66, recY + 84);
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("   Integrar o toggle ao backend para persistir o estado e conectar ao fluxo de WhatsApp real.", 66, recY + 97);

// Rodapé
doc.font("Helvetica").fontSize(8).fillColor(GRAY).text("JADE IA © 2026 — Relatório gerado automaticamente pelo agente de desenvolvimento", 50, doc.page.height - 40, { align: "center", width: 495 });

doc.end();

console.log("PDF gerado em:", OUT);
