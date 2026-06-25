import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { TOM_MAP, MODO_MAP, getSegmentBlock } from '../prompts/index.js';
import type { CompanyConfig } from '../../db/store.js';

// ── Persistent memory file ────────────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'jade-memory.json');

interface ChunkRecord {
  text: string;
  embedding: number[];
}

interface CompanyMemoryEntry {
  configUpdatedAt: string;
  chunks: ChunkRecord[];
}

interface MemoryStore {
  companies: Record<string, CompanyMemoryEntry>;
}

function loadMemory(): MemoryStore {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return { companies: {} };
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8')) as MemoryStore;
  } catch {
    return { companies: {} };
  }
}

function saveMemory(data: MemoryStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.error('jade-memory: save error', err);
  }
}

// ── Company identity ──────────────────────────────────────────────────────────

export function getCompanyId(nome: string): string {
  return crypto.createHash('md5').update(nome.toLowerCase().trim()).digest('hex').slice(0, 12);
}

// ── Chunk splitting ───────────────────────────────────────────────────────────

function line(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `${label}: ${v}` : null;
}

/**
 * Splits a company config into semantically distinct chunks for embedding.
 * Each chunk covers one concern so retrieval can surface the most relevant part.
 */
export function buildCompanyChunks(config: CompanyConfig): string[] {
  const chunks: string[] = [];

  // Chunk 1: Identity
  const identity = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line('Produto principal', config.produto),
    line('Tom de voz', TOM_MAP[config.tom] ?? config.tom),
    config.modoOperacao ? line('Modo de operação', MODO_MAP[config.modoOperacao] ?? config.modoOperacao) : null,
    line('Localização', [config.cidade, config.estado].filter(Boolean).join(' / ') || undefined),
  ].filter(Boolean).join('\n');
  if (identity.trim()) chunks.push(`[Identidade da empresa]\n${identity}`);

  // Chunk 2: Products & pricing
  if (config.planos?.trim()) {
    chunks.push(`[Produtos e planos]\n${config.planos.trim()}`);
  }

  // Chunk 3: Target audience
  if (config.publicoAlvo?.trim()) {
    chunks.push(`[Público-alvo]\n${config.publicoAlvo.trim()}`);
  }

  // Chunk 4: Differentials & competitors
  const competitive = [
    config.diferenciais?.trim() ? `Diferenciais:\n${config.diferenciais.trim()}` : null,
    config.concorrentes?.trim() ? `Concorrentes: ${config.concorrentes.trim()}` : null,
  ].filter(Boolean).join('\n\n');
  if (competitive) chunks.push(`[Posicionamento competitivo]\n${competitive}`);

  // Chunk 5: Objections
  if (config.objecoesComuns?.trim()) {
    chunks.push(`[Objeções comuns dos clientes]\n${config.objecoesComuns.trim()}`);
  }

  // Chunk 6: Goals & team
  const ops = [
    config.metas?.trim() ? `Metas: ${config.metas.trim()}` : null,
    config.equipe?.trim() ? `Equipe: ${config.equipe.trim()}` : null,
  ].filter(Boolean).join('\n');
  if (ops) chunks.push(`[Metas e equipe]\n${ops}`);

  // Chunk 7: Commercial rules
  if (config.regrasComerciais?.trim()) {
    chunks.push(`[Regras comerciais]\n${config.regrasComerciais.trim()}`);
  }

  // Chunk 8: Segment specialist block
  const specialist = getSegmentBlock(config.segmento);
  if (specialist) chunks.push(`[Especialização por segmento]\n${specialist}`);

  return chunks.filter((c) => c.trim().length > 0);
}

// ── Cosine similarity ─────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Embedding persistence ─────────────────────────────────────────────────────

export function saveCompanyEmbeddings(
  config: CompanyConfig,
  chunks: string[],
  embeddings: number[][],
): void {
  const id = getCompanyId(config.nome);
  const mem = loadMemory();
  mem.companies[id] = {
    configUpdatedAt: config.updated_at,
    chunks: chunks.map((text, i) => ({ text, embedding: embeddings[i] ?? [] })),
  };
  saveMemory(mem);
}

export function getCompanyEmbeddings(nome: string): CompanyMemoryEntry | null {
  const id = getCompanyId(nome);
  return loadMemory().companies[id] ?? null;
}

export function isEmbeddingStale(nome: string, configUpdatedAt: string): boolean {
  const stored = getCompanyEmbeddings(nome);
  if (!stored || stored.chunks.length === 0) return true;
  return stored.configUpdatedAt !== configUpdatedAt;
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

/**
 * Given a query embedding, return the top-K most relevant company memory chunks.
 * Returns empty array when no embeddings are stored or on any error.
 */
export function retrieveRelevantChunks(
  nome: string,
  queryEmbedding: number[],
  topK = 4,
): string[] {
  try {
    const stored = getCompanyEmbeddings(nome);
    if (!stored || stored.chunks.length === 0) return [];

    const scored = stored.chunks.map((c) => ({
      text: c.text,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((c) => c.score > 0.3)
      .map((c) => c.text);
  } catch {
    return [];
  }
}

// ── Full text block (existing behaviour — kept for fallback) ──────────────────

/**
 * Build the full JADE Memory block injected into the system prompt.
 * Used when embedding retrieval is unavailable or as complementary context.
 */
export function buildCompanyMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = [
    '## MEMÓRIA DA EMPRESA (JADE Memory)',
    '',
    'Você tem acesso às informações persistentes da empresa do usuário.',
    'Use-as automaticamente em TODAS as respostas, estratégias e materiais — nunca peça dados que já estão aqui.',
    '',
  ];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line('Localização', [config.cidade, config.estado].filter(Boolean).join(' / ') || undefined),
    line('Produto / Serviço principal', config.produto),
    line('Tom de voz', TOM_MAP[config.tom] ?? config.tom),
    config.modoOperacao ? line('Modo de operação', MODO_MAP[config.modoOperacao] ?? config.modoOperacao) : null,
  ].filter(Boolean);

  parts.push(...(coreLines as string[]));

  if (config.planos?.trim()) {
    parts.push('', `**Produtos e planos:**\n${config.planos.trim()}`);
  }

  const extendedBlocks = [
    config.publicoAlvo?.trim() ? `**Público-alvo:**\n${config.publicoAlvo.trim()}` : null,
    config.diferenciais?.trim() ? `**Diferenciais competitivos:**\n${config.diferenciais.trim()}` : null,
    config.objecoesComuns?.trim() ? `**Objeções comuns dos clientes:**\n${config.objecoesComuns.trim()}` : null,
    config.concorrentes?.trim() ? `**Concorrentes principais:**\n${config.concorrentes.trim()}` : null,
    config.metas?.trim() ? `**Metas e objetivos:**\n${config.metas.trim()}` : null,
    config.equipe?.trim() ? `**Equipe:**\n${config.equipe.trim()}` : null,
    config.regrasComerciais?.trim() ? `**Regras comerciais:**\n${config.regrasComerciais.trim()}` : null,
  ].filter(Boolean) as string[];

  if (extendedBlocks.length > 0) {
    parts.push('');
    parts.push(...extendedBlocks.flatMap((b) => [b, '']));
  }

  parts.push(
    'Use todas essas informações para personalizar respostas, argumentos de venda,',
    'estratégias e materiais criados para essa empresa. Nunca invente dados que não estão aqui.',
  );

  const specialistBlock = getSegmentBlock(config.segmento);
  if (specialistBlock) {
    parts.push('', specialistBlock);
  }

  return parts.join('\n');
}
