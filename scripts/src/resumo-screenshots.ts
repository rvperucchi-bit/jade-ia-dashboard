import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const OUTPUT = path.resolve(__dirname, "../../exports/jade-ia-screenshots.pdf");
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: "JADE IA — Capturas de Tela", Author: "Replit Agent" } });
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const W = 595 - 96;
const PINK = "#FF0080";
const CYAN = "#00E5FF";

let pageNum = 0;
function setup() {
  pageNum++;
  doc.rect(0, 0, 595, 842).fill("#090A0F");
  const saved = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.fontSize(8).fillColor("#4E5366").font("Helvetica")
    .text(`JADE IA  Capturas de Tela  Pag. ${pageNum}`, 48, 808, { align: "center", width: W, lineBreak: false });
  doc.page.margins.bottom = saved;
  doc.x = 48; doc.y = 48;
}
setup();
doc.on("pageAdded", setup);

function clean(s: string) {
  return s.replace(/[^\x00-\x7E\u00C0-\u024F]/g, "");
}

doc.rect(0, 0, 595, 110).fill("#0D0D18");
doc.fontSize(28).fillColor(PINK).font("Helvetica-Bold").text("JADE IA", 48, 24);
doc.fontSize(14).fillColor("#FFFFFF").font("Helvetica-Bold")
  .text("Capturas de Tela — Documentacao Visual Completa", 48, 56);
doc.fontSize(10).fillColor("#8F94A8").font("Helvetica")
  .text("25 de junho de 2026  |  36 telas  |  exports/jade-ia-screenshots.zip", 48, 78);
doc.y = 128;

function sec(title: string) {
  if (doc.y > 740) doc.addPage();
  doc.moveDown(0.4);
  doc.rect(48, doc.y, 4, 16).fill(CYAN);
  doc.fontSize(11).fillColor(CYAN).font("Helvetica-Bold")
    .text(clean(title).toUpperCase(), 60, doc.y, { width: W - 12 });
  doc.moveDown(0.9);
  doc.rect(48, doc.y, W, 0.5).fill("#1A1A2E");
  doc.moveDown(0.7);
}

function bullet(text: string, color = "rgba(255,255,255,0.85)") {
  if (doc.y > 750) doc.addPage();
  doc.rect(52, doc.y + 5, 5, 5).fillOpacity(1).fill(PINK);
  doc.fontSize(11).fillColor(color).font("Helvetica")
    .text(clean(text), 64, doc.y, { width: W - 20 });
  doc.moveDown(0.65);
}

const screens: [string, string][] = [
  ["01-login.jpg",            "01 - Login"],
  ["02-cadastro.jpg",         "02 - Cadastro"],
  ["03-onboarding.jpg",       "03 - Onboarding (config inicial)"],
  ["04-splash.jpg",           "04 - Splash / Carregamento"],
  ["05-scanner.jpg",          "05 - Scanner de Lead"],
  ["06-crm.jpg",              "06 - CRM (lista de leads)"],
  ["07-pipeline.jpg",         "07 - Pipeline de Vendas"],
  ["08-carteira.jpg",         "08 - Carteira de Clientes"],
  ["09-briefing.jpg",         "09 - Briefing de Lead"],
  ["10-objecoes.jpg",         "10 - Objecoes"],
  ["11-roteiro.jpg",          "11 - Roteiro de Abordagem"],
  ["12-relatorios.jpg",       "12 - Relatorios"],
  ["13-marketing.jpg",        "13 - Marketing IA"],
  ["14-planejamento.jpg",     "14 - Planejamento"],
  ["15-roleplay.jpg",         "15 - Roleplay de Vendas"],
  ["16-painelexecutivo.jpg",  "16 - Painel Executivo"],
  ["17-meutime.jpg",          "17 - Meu Time"],
  ["18-metas.jpg",            "18 - Metas"],
  ["19-relatoriogestor.jpg",  "19 - Relatorio Gestor"],
  ["20-gestao.jpg",           "20 - Gestao"],
  ["21-feedbackjade.jpg",     "21 - Feedback JADE"],
  ["22-analise.jpg",          "22 - Analise de Lead"],
  ["23-notificacoes.jpg",     "23 - Notificacoes"],
  ["24-criarrota.jpg",        "24 - Criar Rota Comercial"],
  ["25-laudo.jpg",            "25 - Laudo de Lead"],
  ["26-empresa.jpg",          "26 - Minha Empresa"],
  ["27-perfil.jpg",           "27 - Meu Perfil"],
  ["28-plano.jpg",            "28 - Meu Plano"],
  ["29-uso.jpg",              "29 - Uso de Creditos"],
  ["30-admin-uso.jpg",        "30 - Admin Uso (erro runtime fmtUsd)"],
  ["31-whatsapp-config.jpg",  "31 - Integracao WhatsApp"],
  ["32-historico.jpg",        "32 - Historico de Conversas"],
  ["33-loja.jpg",             "33 - Loja JADE"],
  ["34-jade-chat.jpg",        "34 - Hub JADE / Tabs (jade)"],
  ["35-leads.jpg",            "35 - Tabs Leads"],
  ["36-conversas.jpg",        "36 - Tabs Conversas"],
];

sec("Metodo de Captura");
doc.fontSize(11).fillColor("#FFFFFF").font("Helvetica")
  .text(
    "Ferramenta: screenshot (app_preview) via Replit Agent\n" +
    "URL base: Expo Dev Domain (REPLIT_EXPO_DEV_DOMAIN)\n" +
    "Resolucao: 390 x 844 px (iPhone 14 equivalente)\n" +
    "Formato: JPEG por tela, compactados em ZIP\n" +
    "Output: screenshots/jade-ia/  |  exports/jade-ia-screenshots.zip (729 KB)",
    48, doc.y, { width: W }
  );
doc.moveDown(1.2);

sec("Telas Capturadas (36 no total)");

for (const [, label] of screens) {
  bullet(label);
}

doc.moveDown(0.5);
sec("Observacoes");

bullet("30-admin-uso: tela mostra erro 'Something went wrong' (TypeError: fmtUsd recebe undefined).");
bullet("   Causa: dados de uso inexistentes na API local; tela capturada como-esta (estado real).");
bullet("34-35-36: tabs /jade, /leads, /conversas redirecionam para onboarding (empresa nao configurada).");
bullet("   Comportamento correto — app protege as tabs ate o usuario configurar a empresa.");
bullet("ZIP final: exports/jade-ia-screenshots.zip (36 imagens, 729 KB).");

doc.end();
stream.on("finish", () => console.log("PDF gerado:", OUTPUT));
