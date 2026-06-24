import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";

type Section = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

type Report = {
  title: string;
  subtitle?: string;
  date?: string;
  output: string;
  sections: Section[];
};

const COLORS = {
  ink: "#0B0B0F",
  gold: "#C9A24B",
  text: "#1A1A1F",
  muted: "#6B6B73",
  rule: "#E3E1DA",
};

function loadReport(): { report: Report; baseDir: string } {
  const arg = process.argv[2];
  if (!arg) {
    throw new Error("Uso: tsx ./src/gerar-pdf.ts <caminho-do-report.json>");
  }
  const jsonPath = resolve(arg);
  const raw = readFileSync(jsonPath, "utf8");
  return { report: JSON.parse(raw) as Report, baseDir: dirname(jsonPath) };
}

function main() {
  const { report, baseDir } = loadReport();
  const outPath = resolve(baseDir, report.output);
  mkdirSync(dirname(outPath), { recursive: true });

  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const stream = createWriteStream(outPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;

  // Header band
  doc.rect(0, 0, doc.page.width, 110).fill(COLORS.ink);
  doc.fillColor(COLORS.gold).fontSize(9).font("Helvetica-Bold")
    .text("JADE IA", left, 32, { characterSpacing: 3 });
  doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold")
    .text(report.title, left, 48, { width: pageWidth });
  if (report.subtitle) {
    doc.fillColor("#B9B9C2").fontSize(10).font("Helvetica")
      .text(report.subtitle, left, 82, { width: pageWidth });
  }

  doc.y = 140;
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica")
    .text(report.date ?? new Date().toLocaleDateString("pt-BR"), left, doc.y);
  doc.moveDown(1);

  for (const section of report.sections) {
    if (doc.y > doc.page.height - 140) doc.addPage();

    // Section heading with gold tick
    const hy = doc.y;
    doc.rect(left, hy + 2, 3, 14).fill(COLORS.gold);
    doc.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold")
      .text(section.heading, left + 12, hy, { width: pageWidth - 12 });
    doc.moveDown(0.4);

    if (section.body) {
      for (const p of section.body) {
        doc.fillColor(COLORS.text).fontSize(10.5).font("Helvetica")
          .text(p, left, doc.y, { width: pageWidth, lineGap: 2 });
        doc.moveDown(0.35);
      }
    }

    if (section.bullets) {
      for (const b of section.bullets) {
        if (doc.y > doc.page.height - 90) doc.addPage();
        const by = doc.y;
        doc.fillColor(COLORS.gold).fontSize(10.5).font("Helvetica-Bold")
          .text("•", left + 4, by, { width: 12 });
        doc.fillColor(COLORS.text).fontSize(10.5).font("Helvetica")
          .text(b, left + 20, by, { width: pageWidth - 20, lineGap: 2 });
        doc.moveDown(0.25);
      }
    }

    doc.moveDown(0.6);
    doc.strokeColor(COLORS.rule).lineWidth(0.5)
      .moveTo(left, doc.y).lineTo(left + pageWidth, doc.y).stroke();
    doc.moveDown(0.8);
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
      .text(
        `JADE IA · Relatório gerado automaticamente · pág. ${i - range.start + 1}/${range.count}`,
        left,
        doc.page.height - 40,
        { width: pageWidth, align: "center" },
      );
  }

  doc.end();
  stream.on("finish", () => {
    console.log(`PDF gerado: ${outPath}`);
  });
}

main();
