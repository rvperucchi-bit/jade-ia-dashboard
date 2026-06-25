/**
 * File content extractor — zero external dependencies.
 *
 * Supported inputs:
 *   text/*       → decode UTF-8 directly (txt, csv, md, xml, html, etc.)
 *   application/json, application/csv, application/xml → decode as text
 *   image/*      → signal caller to route to Vision API
 *   application/pdf → best-effort text extraction from raw PDF bytes
 *   others       → attempt UTF-8 decode; fall back to binary-notice message
 *
 * All text outputs are capped at MAX_CHARS to stay within context window limits.
 */

const MAX_CHARS = 12000;

export type FileExtractionResult =
  | { type: 'text'; content: string; truncated: boolean }
  | { type: 'image'; base64: string; mimeType: string }
  | { type: 'unsupported'; reason: string };

const TEXT_MIME_PREFIXES = ['text/'];
const TEXT_MIME_EXACT = new Set([
  'application/json',
  'application/xml',
  'application/csv',
  'application/x-csv',
  'application/markdown',
]);

function isTextMime(mime: string): boolean {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return TEXT_MIME_PREFIXES.some((p) => base.startsWith(p)) || TEXT_MIME_EXACT.has(base);
}

function isImageMime(mime: string): boolean {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return base.startsWith('image/');
}

function isPdfMime(mime: string): boolean {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return base === 'application/pdf';
}

/**
 * Basic PDF text extraction from raw bytes — no external libraries.
 * Finds text strings inside BT...ET blocks by matching the Tj/TJ operators.
 * Works reliably for text-based PDFs; image-based (scanned) PDFs yield empty.
 */
function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString('binary');
  const chunks: string[] = [];

  // Match (string) Tj  — single string show
  const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRe.exec(raw)) !== null) {
    const s = m[1]!
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    if (s.trim()) chunks.push(s);
  }

  // Match [(string) spacing (string) ...] TJ  — array show
  const tjArrRe = /\[((?:[^[\]\\]|\\.)*)\]\s*TJ/g;
  while ((m = tjArrRe.exec(raw)) !== null) {
    const inner = m[1]!;
    const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
    let sm: RegExpExecArray | null;
    while ((sm = strRe.exec(inner)) !== null) {
      const s = sm[1]!
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (s.trim()) chunks.push(s);
    }
  }

  return chunks.join(' ').replace(/\s{3,}/g, '  ').trim();
}

/**
 * Main extraction function.
 *
 * @param fileBase64  Raw base64 of the file (no data-URI prefix).
 * @param mimeType    MIME type declared by the client.
 * @param fileName    Optional file name (used for fallback type detection).
 */
export function extractFileContent(
  fileBase64: string,
  mimeType: string,
  fileName?: string,
): FileExtractionResult {
  // Infer MIME from extension when caller sends generic 'application/octet-stream'
  const effectiveMime = inferMimeFromName(mimeType, fileName);

  if (isImageMime(effectiveMime)) {
    return { type: 'image', base64: fileBase64, mimeType: effectiveMime };
  }

  const buffer = Buffer.from(fileBase64, 'base64');

  if (isPdfMime(effectiveMime)) {
    const raw = extractPdfText(buffer);
    if (!raw) {
      return {
        type: 'unsupported',
        reason:
          'PDF parece ser baseado em imagens (escaneado). ' +
          'Envie-o como imagem para análise via visão computacional.',
      };
    }
    const truncated = raw.length > MAX_CHARS;
    return { type: 'text', content: raw.slice(0, MAX_CHARS), truncated };
  }

  if (isTextMime(effectiveMime)) {
    const raw = buffer.toString('utf-8');
    const truncated = raw.length > MAX_CHARS;
    return { type: 'text', content: raw.slice(0, MAX_CHARS), truncated };
  }

  // Last-resort: try UTF-8 decode; if it looks mostly readable, return it
  try {
    const raw = buffer.toString('utf-8');
    const printableRatio =
      (raw.match(/[\x20-\x7E\n\r\t\u00C0-\u024F]/g)?.length ?? 0) / (raw.length || 1);
    if (printableRatio > 0.8) {
      const truncated = raw.length > MAX_CHARS;
      return { type: 'text', content: raw.slice(0, MAX_CHARS), truncated };
    }
  } catch {
    // ignore
  }

  return {
    type: 'unsupported',
    reason: `Tipo de arquivo não suportado para extração de texto: ${effectiveMime}${fileName ? ` (${fileName})` : ''}.`,
  };
}

function inferMimeFromName(mime: string, fileName?: string): string {
  if (mime && mime !== 'application/octet-stream') return mime;
  if (!fileName) return mime;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    txt: 'text/plain',
    csv: 'text/csv',
    md: 'text/markdown',
    html: 'text/html',
    htm: 'text/html',
    xml: 'application/xml',
    json: 'application/json',
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return map[ext] ?? mime;
}
