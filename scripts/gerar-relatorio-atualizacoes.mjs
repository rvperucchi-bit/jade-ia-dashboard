import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.resolve("relatorio-atualizacoes.pdf");
const doc = new PDFDocument({ margin: 50, size: "A4" });
doc.pipe(fs.createWriteStream(OUT));

// ── Cores ──────────────────────────────────────────────
const PINK    = "#FF0080";
const PURPLE  = "#8400FF";
const GREEN   = "#00D68F";
const YELLOW  = "#FFB300";
const BLUE    = "#4285F4";
const CYAN    = "#4ECDC4";
const DARK    = "#0A0A0F";
const GRAY    = "#AAAACC";
const WHITE   = "#FFFFFF";

// ── Helpers ────────────────────────────────────────────
const W = doc.page.width - 100; // 495

function bg() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK);
}

function rect(x, y, w, h, color, radius = 6) {
  doc.save().roundedRect(x, y, w, h, radius).fill(color).restore();
}

function badge(x, y, text, bg, fg = "#fff") {
  const bw = doc.widthOfString(text, { fontSize: 9 }) + 16;
  rect(x, y, bw, 18, bg, 4);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(fg).text(text, x + 8, y + 4, { lineBreak: false });
  return bw;
}

function sectionHeader(title, color, emoji) {
  if (doc.y + 50 > doc.page.height - 70) { doc.addPage(); bg(); }
  doc.moveDown(0.4);
  const y = doc.y;
  rect(50, y, W, 32, color + "28", 8);
  doc.save()
    .roundedRect(50, y, 5, 32, 3)
    .fill(color)
    .restore();
  doc.font("Helvetica-Bold").fontSize(13).fillColor(WHITE)
    .text(`${emoji}  ${title}`, 66, y + 9);
  doc.moveDown(1.8);
}

function featureRow(titulo, descricao, tipo, cor, isShaded) {
  const ROW_H = 52;
  if (doc.y + ROW_H > doc.page.height - 70) { doc.addPage(); bg(); }
  const y = doc.y;
  rect(50, y, W, ROW_H, isShaded ? "#16161F" : "#111118", 6);
  // Tipo badge
  badge(58, y + 8, tipo, cor + "33", cor);
  // Título
  doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE).text(titulo, 58, y + 28, { lineBreak: false });
  // Descrição (right side)
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(descricao, 200, y + 10, { width: 335 });
  doc.y = y + ROW_H + 4;
}

function apiRow(method, endpoint, desc, isShaded) {
  const ROW_H = 40;
  if (doc.y + ROW_H > doc.page.height - 70) { doc.addPage(); bg(); }
  const y = doc.y;
  rect(50, y, W, ROW_H, isShaded ? "#16161F" : "#111118", 6);
  const mColor = method === "POST" ? "#6C63FF" : method === "GET" ? GREEN : YELLOW;
  badge(58, y + 11, method, mColor + "33", mColor);
  const mw = doc.widthOfString(method, { fontSize: 9 }) + 16;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text(endpoint, 58 + mw + 8, y + 14, { lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(desc, 58 + mw + 8, y + 26, { width: W - mw - 24, lineBreak: false });
  doc.y = y + ROW_H + 4;
}

function bugRow(file, was, now, isShaded) {
  const ROW_H = 56;
  if (doc.y + ROW_H > doc.page.height - 70) { doc.addPage(); bg(); }
  const y = doc.y;
  rect(50, y, W, ROW_H, isShaded ? "#16161F" : "#111118", 6);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text(file, 58, y + 8, { lineBreak: false });
  doc.font("Helvetica").fontSize(8.5).fillColor("#FF3B5C").text("ANTES: " + was, 58, y + 24, { width: 200, lineBreak: false });
  doc.font("Helvetica").fontSize(8.5).fillColor(GREEN).text("DEPOIS: " + now, 58, y + 37, { width: 200, lineBreak: false });
  doc.y = y + ROW_H + 4;
}

// ══════════════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════════════
bg();

// Linha decorativa topo
rect(0, 0, doc.page.width, 4, PINK, 0);
rect(doc.page.width * 0.4, 0, doc.page.width * 0.6, 4, PURPLE, 0);

// Título
doc.font("Helvetica-Bold").fontSize(38).fillColor(WHITE).text("JADE IA", 50, 80, { align: "center" });
doc.font("Helvetica").fontSize(16).fillColor(PINK).text("Release Notes — Sprint de Funcionalidades", 50, 132, { align: "center" });
doc.font("Helvetica").fontSize(11).fillColor(GRAY).text(
  `Gerado em ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`,
  50, 160, { align: "center" }
);

// Linha separadora
rect(50, 188, W, 1, "#FFFFFF12", 0);

// Sumário executivo em cards
const CARD_Y = 208;
const cards = [
  { label: "Correções de bugs",    value: "3",  color: GREEN   },
  { label: "Novos endpoints API",  value: "5",  color: BLUE    },
  { label: "Novas telas",          value: "4",  color: PINK    },
  { label: "Telas atualizadas",    value: "4",  color: PURPLE  },
];
const cw = (W - 30) / 4;
cards.forEach((c, i) => {
  const cx = 50 + i * (cw + 10);
  rect(cx, CARD_Y, cw, 78, "#16161F", 10);
  doc.save().roundedRect(cx, CARD_Y, cw, 3, 1).fill(c.color).restore();
  doc.font("Helvetica-Bold").fontSize(30).fillColor(c.color).text(c.value, cx, CARD_Y + 14, { width: cw, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(c.label, cx, CARD_Y + 52, { width: cw, align: "center", lineBreak: false });
});

doc.y = CARD_Y + 100;

// O que mudou — lista rápida
rect(50, doc.y, W, 170, "#111118", 10);
const listY = doc.y + 14;
doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE).text("O que foi entregue neste sprint:", 66, listY);
const items = [
  ["🔧", YELLOW,  "Correções",     "meutime.tsx, carteira.tsx e conversas.tsx — 3 botões parciais corrigidos"],
  ["⚡", PINK,    "JADE Autônoma", "Toggle agora persiste via API + AsyncStorage + painel de status em tempo real"],
  ["🗺️", GREEN,   "Criar Rota",    "Nova tela PRO — planejamento inteligente de visitas com JADE + Google Maps"],
  ["🛡️", CYAN,    "Objeções",      "Nova tela PRO — 6 chips + análise psicológica + 3 scripts por JADE"],
  ["📅", BLUE,    "Planejamento",  "Nova tela PRO — agenda diária gerada pela API + confirmar/ajustar"],
  ["📢", PURPLE,  "Notificar Time","gestao.tsx ganhou botão de broadcast com tipos Informativo/Urgente/Motivacional"],
  ["🔗", "#4285F4","WhatsApp",     "Nova tela de instrução para integração do WhatsApp Business API"],
];
items.forEach(([emoji, col, title, desc], i) => {
  const iy = listY + 22 + i * 20;
  doc.font("Helvetica").fontSize(10).fillColor(col).text(`${emoji} ${title}:`, 66, iy, { lineBreak: false, continued: false });
  doc.font("Helvetica").fontSize(10).fillColor(GRAY).text(desc, 66 + 90, iy, { lineBreak: false });
});

// Footer capa
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("JADE IA © 2026  ·  Relatório de Release gerado automaticamente  ·  Versão 1.1.0", 50, doc.page.height - 36, { align: "center", width: W });

// ══════════════════════════════════════════════════════════════
// PÁGINA 2 — CORREÇÕES DE BUGS
// ══════════════════════════════════════════════════════════════
doc.addPage();
bg();

doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE).text("Correções de Bugs", 50, 56);
doc.font("Helvetica").fontSize(12).fillColor(GRAY).text("3 botões que estavam com funcionamento parcial foram corrigidos", 50, 84);
rect(50, 104, W, 1, "#FFFFFF12", 0);
doc.y = 116;

sectionHeader("meutime.tsx — Salvar Vendedor", YELLOW, "⚠️");
bugRow("handleAdd()", "catch{} vazio — erros silenciosos ao salvar no backend", "Alert.alert(\"Erro ao salvar\") + revert + setVendedores só atualiza após sucesso", true);
bugRow("loading state", "Modal fechava mesmo quando API retornava erro HTTP", "finally { setSaving(false) } + try só fecha modal no sucesso", false);

sectionHeader("carteira.tsx — Registrar Visita", YELLOW, "⚠️");
bugRow("registrarVisita()", "Só atualizava estado local, sem chamar a API", "Agora chama POST /api/carteira/:id/visita com { observacao, tipo, data }", true);
bugRow("loading state", "Sem spinner no botão do modal durante o registro", "Adicionado estado registrando + ActivityIndicator no botão", false);

sectionHeader("conversas.tsx — Ativar JADE", YELLOW, "⚠️");
bugRow("handleToggle()", "Apenas setJadeAtiva(!v) — só estado local React", "POST /api/jade/status + AsyncStorage fallback offline + carrega status no useEffect", true);
bugRow("UI feedback", "Sem feedback visual além da cor do botão", "Painel autônomo: log de atividade, status em tempo real, CTA WhatsApp config", false);

// ══════════════════════════════════════════════════════════════
// PÁGINA 3 — NOVOS ENDPOINTS API
// ══════════════════════════════════════════════════════════════
doc.addPage();
bg();

doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE).text("Novos Endpoints de API", 50, 56);
doc.font("Helvetica").fontSize(12).fillColor(GRAY).text("5 novos endpoints registrados em /api — servidor Express + JSON store", 50, 84);
rect(50, 104, W, 1, "#FFFFFF12", 0);
doc.y = 116;

sectionHeader("JADE Status & Modo Autônomo", PINK, "🤖");
apiRow("GET",  "/api/jade/status",           "Retorna { ativo, updatedAt } — estado atual do toggle JADE", true);
apiRow("POST", "/api/jade/status",           "Altera estado JADE { ativo: boolean } — persiste em memória", false);
apiRow("GET",  "/api/jade/autonomo",          "Retorna { ativo, logs[] } — modo autônomo + log de atividade", true);
apiRow("POST", "/api/jade/autonomo",          "Ativa/desativa modo autônomo — zera logs quando desativado", false);

sectionHeader("Dashboard do Gestor", PURPLE, "📊");
apiRow("GET",  "/api/dashboard/gestor",       "Retorna time + pipeline_consolidado + alertas + total_receita + percentual_atingido", true);

sectionHeader("Planejamento Diário", BLUE, "📅");
apiRow("GET",  "/api/planejamento/:userId/hoje", "Carrega plano do dia — gera plano padrão se ainda não existir", true);
apiRow("POST", "/api/planejamento/:userId/hoje", "Salva/confirma planejamento — { confirmado, itens, cronograma }", false);

sectionHeader("Notificações do Time", CYAN, "📢");
apiRow("GET",  "/api/notificacoes",           "Lista notificações em ordem cronológica reversa (view do vendedor)", true);
apiRow("POST", "/api/notificacoes/time",      "Gestor envia notificação { mensagem, tipo, destinatarios } para o time", false);

// ══════════════════════════════════════════════════════════════
// PÁGINA 4 — NOVAS TELAS
// ══════════════════════════════════════════════════════════════
doc.addPage();
bg();

doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE).text("Novas Telas — Mobile", 50, 56);
doc.font("Helvetica").fontSize(12).fillColor(GRAY).text("4 novas telas adicionadas ao app Expo + registradas no Stack Navigator", 50, 84);
rect(50, 104, W, 1, "#FFFFFF12", 0);
doc.y = 116;

sectionHeader("criarrota.tsx — Criar Rota  (PRO)", GREEN, "🗺️");
featureRow("Paradas dinâmicas", "Adicione N paradas com nome do cliente, endereço e toggle Agendado/Lead quente 🔥", "INPUT", GREEN, true);
featureRow("Criar Rota Inteligente", "Botão envia todas paradas para /api/jade/chat → JADE gera ordem otimizada + horários", "GEMINI", GREEN, false);
featureRow("Output completo", "Ordem otimizada, horários, oportunidades no caminho (leads quentes) e resumo do dia", "OUTPUT", GREEN, true);
featureRow("Abrir no Maps", "Deep link para Google Maps com waypoints: maps.google.com/maps/dir/end1/end2/...", "MAPS", GREEN, false);

sectionHeader("objecoes.tsx — Ajuda com Objeções  (PRO)", CYAN, "🛡️");
featureRow("Chips de objeções", "6 chips rápidos: Está caro / Preciso pensar / Falar com sócio / Fornecedor / Prioridade / Sem orçamento", "CHIPS", CYAN, true);
featureRow("Campo livre", "Área de texto para descrever a reunião e objeções específicas não cobertas pelos chips", "INPUT", CYAN, false);
featureRow("Estratégia completa", "JADE gera: análise psicológica + 3 scripts (suave/consultivo/direto) + pergunta-chave + próximo passo", "GEMINI", CYAN, true);
featureRow("Copiar e regenerar", "Botão copiar result + botão 'Gerar nova estratégia' para variações alternativas", "UX", CYAN, false);

sectionHeader("planejamento.tsx — Planejamento do Dia  (PRO)", BLUE, "📅");
featureRow("Carrega da API", "GET /api/planejamento/:userId/hoje — gera plano padrão se não houver um ainda", "API", BLUE, true);
featureRow("Itens por tipo", "4 tipos com ícone e cor: Compromisso (roxo), Lead quente (pink), Follow-up (amarelo), Meta (verde)", "UI", BLUE, false);
featureRow("Análise da JADE", "Botão envia agenda para /api/jade/chat → JADE gera motivação + dica por compromisso + alertas", "GEMINI", BLUE, true);
featureRow("Confirmar meu dia", "POST /api/planejamento/:userId/hoje com { confirmado: true } — gestor vê se confirmou", "API", BLUE, false);

sectionHeader("whatsapp-config.tsx — Configurar WhatsApp", "#25D366", "💬");
featureRow("5 passos de configuração", "Guia visual: Meta Business Suite → Número → Token → Webhook → Testar", "DOCS", "#25D366", true);
featureRow("CTA Developers", "Link direto para developers.facebook.com/docs/whatsapp com Linking.openURL()", "LINK", "#25D366", false);
featureRow("Contato suporte", "Botão 'Falar com suporte' abre email para comercial@jadeia.com.br", "SUPORTE", "#25D366", true);

// ══════════════════════════════════════════════════════════════
// PÁGINA 5 — TELAS ATUALIZADAS
// ══════════════════════════════════════════════════════════════
doc.addPage();
bg();

doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE).text("Telas Existentes Atualizadas", 50, 56);
doc.font("Helvetica").fontSize(12).fillColor(GRAY).text("4 telas existentes receberam novas funcionalidades neste sprint", 50, 84);
rect(50, 104, W, 1, "#FFFFFF12", 0);
doc.y = 116;

sectionHeader("conversas.tsx — Ativar JADE (nova UI)", PINK, "🤖");
featureRow("Painel autônomo", "Aparece abaixo do toggle quando JADE está ativa — status 🟢 JADE ativa — respondendo automaticamente", "NOVO", PINK, true);
featureRow("Log de atividade", "Mostra atividade recente simulada: 'JADE respondeu a Carlos Mendes às 09:14'", "NOVO", PINK, false);
featureRow("CTA WhatsApp", "Botão 'Configurar integração WhatsApp' com badge amarelo 'Necessário para funcionar'", "NOVO", PINK, true);
featureRow("Persistência", "useEffect carrega status da API no mount + AsyncStorage offline fallback", "FIX", PINK, false);

sectionHeader("mais.tsx — Menu Ferramentas", PURPLE, "📋");
featureRow("Criar Rota", "Novo item em Ferramentas de Vendas → /criarrota com badge PRO e ícone navigation", "NOVO", PURPLE, true);
featureRow("Ajuda com Objeções", "Novo item → /objecoes com badge PRO e ícone shield", "NOVO", PURPLE, false);
featureRow("Planejamento do Dia", "Novo item → /planejamento com badge PRO e ícone calendar", "NOVO", PURPLE, true);

sectionHeader("gestao.tsx — Hub Enterprise", PURPLE, "🏢");
featureRow("Botão Notificar Time", "Header ganhou botão '🔔 Notificar' que abre modal de broadcast", "NOVO", PURPLE, true);
featureRow("Modal de notificação", "Tipo (Informativo/Urgente/Motivacional) + campo de mensagem + POST /api/notificacoes/time", "NOVO", PURPLE, false);
featureRow("Card Planejamento Time", "Hub de 6 cards agora inclui 'Planejamento Time' → /planejamento", "NOVO", PURPLE, true);

sectionHeader("_layout.tsx — Stack Navigator", GRAY, "🔧");
featureRow("4 novas rotas", "criarrota, objecoes, planejamento, whatsapp-config registradas com headerShown: false", "CONFIG", GRAY, true);

// ── Rodapé final
doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(
  "JADE IA © 2026  ·  Sprint de Funcionalidades  ·  Relatório gerado automaticamente pelo agente de desenvolvimento",
  50, doc.page.height - 36, { align: "center", width: W }
);

doc.end();
console.log("PDF gerado em:", OUT);
