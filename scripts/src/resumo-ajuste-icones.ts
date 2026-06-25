import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const OUTPUT = path.resolve(__dirname, "../../exports/jade-ajuste-icones.pdf");
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: "JADE IA — Ajuste de Interface", Author: "Replit Agent" } });
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
    .text(`JADE IA  Ajuste de Interface  Pag. ${pageNum}`, 48, 808, { align: "center", width: W, lineBreak: false });
  doc.page.margins.bottom = saved;
  doc.x = 48; doc.y = 48;
}
setup();
doc.on("pageAdded", setup);

function clean(s: string) {
  return s.replace(/[^\x00-\x7E\u00C0-\u024F]/g, "");
}

// ── Cabecalho ────────────────────────────────────────────────
doc.rect(0, 0, 595, 110).fill("#0D0D18");
doc.fontSize(28).fillColor(PINK).font("Helvetica-Bold").text("JADE IA", 48, 24);
doc.fontSize(14).fillColor("#FFFFFF").font("Helvetica-Bold")
  .text("Ajuste de Interface — Menus apenas com texto", 48, 56);
doc.fontSize(10).fillColor("#8F94A8").font("Helvetica")
  .text("25 de junho de 2026  |  artifacts/mobile/app/(tabs)/jade.tsx", 48, 78);
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

function row(label: string, antes: string, depois: string) {
  if (doc.y > 700) doc.addPage();
  doc.fontSize(12).fillColor("#FFFFFF").font("Helvetica-Bold")
    .text(clean(label), 48, doc.y, { width: W });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#E93E3E").font("Helvetica")
    .text("Antes:  " + clean(antes), 52, doc.y, { width: W - 8 });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#22CC88").font("Helvetica")
    .text("Depois: " + clean(depois), 52, doc.y, { width: W - 8 });
  doc.moveDown(1.2);
}

function bullet(text: string, color = "rgba(255,255,255,0.85)") {
  if (doc.y > 750) doc.addPage();
  doc.rect(52, doc.y + 5, 5, 5).fillOpacity(1).fill("#22CC88");
  doc.fontSize(11).fillColor(color).font("Helvetica")
    .text(clean(text), 64, doc.y, { width: W - 20 });
  doc.moveDown(0.65);
}

// ── Secao 1 ─────────────────────────────────────────────────
sec("O que foi alterado");

row(
  "1. Icone decorativo nos cabecalhos das secoes do menu lateral",
  "Feather icon (message-circle, trending-up, volume-2, bar-chart-2, map, settings) antes do titulo de cada secao",
  "Apenas texto do titulo + chevron de expansao (icone de navegacao essencial mantido)"
);

row(
  "2. Botoes de modulos IA — drawer lateral direita",
  "Botao 50x50px com icone Feather centralizado (crosshair, bar-chart-2, pie-chart, clipboard, map-pin, etc.)",
  "Botao 80x36px com label de texto: Radar, Vendas, WhatsApp, Marketing, Analise, Briefing, Rotas"
);

row(
  "3. Icones no menu de contexto (3 pontos — Renomear, Limpar, Exportar...)",
  "Feather icon + texto em cada item do menu de contexto (edit-2, trash-2, download, share-2, sliders)",
  "Apenas texto do item, sem icone"
);

row(
  "4. Cor dos subitens do menu lateral (accordion items)",
  "color: rgba(255,255,255,0.42) — translucido, baixo contraste, dificil leitura",
  "color: rgba(255,255,255,0.82) — branco quase solido, alto contraste, bem legivel"
);

row(
  "5. Largura do drawer direito (constante RDRAWER_W)",
  "76px — espaco insuficiente para exibir texto nos botoes",
  "96px — espaco adequado para os labels curtos dos modulos"
);

// ── Secao 2 ─────────────────────────────────────────────────
sec("O que foi preservado (sem alteracao)");

bullet("Chevron (>) de expansao/colapso em cada cabecalho do accordion — icone de navegacao essencial");
bullet("Icones de hamburguer (abrir menu), fechar (X), voltar, enviar, microfone, anexar — todos essenciais");
bullet("Layout completo: tema escuro, cards, topbar, sidebar, organizacao visual geral");
bullet("Compatibilidade total com Expo Go — sem alteracoes de SDK, dependencias ou configuracao");
bullet("Todos os botoes e opcoes existentes — nada removido funcionalmente");
bullet("Animacoes do accordion (altura e rotacao do chevron) — sem alteracao");
bullet("Gestos de swipe para abrir/fechar drawers — sem alteracao");
bullet("TypeScript: passou sem erros (pnpm --filter @workspace/mobile run typecheck)");

// ── Secao 3 ─────────────────────────────────────────────────
sec("Resumo Tecnico");

doc.fontSize(11).fillColor("#FFFFFF").font("Helvetica")
  .text(
    "Arquivo:  artifacts/mobile/app/(tabs)/jade.tsx  (2018 linhas)\n" +
    "Constante RDRAWER_W: 76  ->  96\n" +
    "Novos estilos adicionados: modBtnLabel, modBtnLabelActive\n" +
    "Import Feather: mantido (ainda usado em chevron-right, botoes de header e footer)\n" +
    "Expo Go: compativel (zero alteracoes em configuracao ou dependencias)",
    48, doc.y, { width: W }
  );

doc.end();
stream.on("finish", () => console.log("PDF gerado:", OUTPUT));
