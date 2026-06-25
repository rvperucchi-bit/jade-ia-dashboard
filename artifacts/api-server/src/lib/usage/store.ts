// ── Usage Store — persiste em data/jade-usage.json ───────────────────────────
// Padrão idêntico ao db/store.ts: load→mutate→save sincronizado.
// Cada empresa tem um registro por mês com contadores e log de eventos.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { PlanKey, UsageOperation } from './plans.js';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const USAGE_FILE = path.join(DATA_DIR, 'jade-usage.json');
const MAX_EVENTS_PER_MONTH = 1000;

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface UsageEvent {
  id: string;
  operation: UsageOperation;
  user_id?: string;
  model?: string;
  /** Tokens de entrada + saída quando disponíveis */
  tokens?: number;
  /** Duração da chamada em ms */
  duration_ms?: number;
  /** Minutos de áudio quando a operação for 'audio' */
  audio_minutes?: number;
  status: 'ok' | 'error' | 'blocked';
  error?: string;
  ts: string;
}

export type CounterMap = Record<UsageOperation, number>;

export interface MonthUsage {
  year_month: string;  // 'YYYY-MM'
  counters: CounterMap;
  events: UsageEvent[];
  last_updated: string;
}

export interface CompanyUsage {
  company_id: string;
  plan: PlanKey;
  months: Record<string, MonthUsage>;
}

interface UsageStore {
  companies: Record<string, CompanyUsage>;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomBytes(6).toString('hex');
}

function yearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function emptyCounters(): CounterMap {
  return {
    chat: 0, radar: 0, audio: 0,
    image_generation: 0, vision: 0,
    document_analysis: 0, embeddings: 0,
  };
}

function emptyMonth(ym: string): MonthUsage {
  return { year_month: ym, counters: emptyCounters(), events: [], last_updated: new Date().toISOString() };
}

// ── I/O ──────────────────────────────────────────────────────────────────────

function loadStore(): UsageStore {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USAGE_FILE)) return { companies: {} };
    const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
    return JSON.parse(raw) as UsageStore;
  } catch {
    return { companies: {} };
  }
}

function saveStore(store: UsageStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[usage-store] save error:', err);
  }
}

// ── API pública ──────────────────────────────────────────────────────────────

/** Garante que a empresa exista no store com o plano informado. */
export function ensureCompany(companyId: string, plan: PlanKey): void {
  const store = loadStore();
  if (!store.companies[companyId]) {
    store.companies[companyId] = { company_id: companyId, plan, months: {} };
    saveStore(store);
  } else if (store.companies[companyId].plan !== plan) {
    store.companies[companyId].plan = plan;
    saveStore(store);
  }
}

/** Registra um evento de uso e incrementa o contador do mês atual. */
export function recordUsageEvent(
  companyId: string,
  plan: PlanKey,
  event: Omit<UsageEvent, 'id' | 'ts'>,
): void {
  const store = loadStore();
  const ym = yearMonth();

  if (!store.companies[companyId]) {
    store.companies[companyId] = { company_id: companyId, plan, months: {} };
  }

  const company = store.companies[companyId]!;
  company.plan = plan;

  if (!company.months[ym]) {
    company.months[ym] = emptyMonth(ym);
  }

  const month = company.months[ym]!;
  const fullEvent: UsageEvent = { id: uid(), ts: new Date().toISOString(), ...event };

  // Incrementa contador (áudio: usa audio_minutes, resto: +1)
  if (event.operation === 'audio') {
    month.counters.audio += event.audio_minutes ?? 0;
  } else if (event.status !== 'blocked') {
    month.counters[event.operation] += 1;
  }

  // Adiciona evento ao log (cap)
  month.events.unshift(fullEvent);
  if (month.events.length > MAX_EVENTS_PER_MONTH) {
    month.events = month.events.slice(0, MAX_EVENTS_PER_MONTH);
  }

  month.last_updated = new Date().toISOString();
  saveStore(store);
}

/** Retorna o uso do mês atual de uma empresa. */
export function getMonthUsage(companyId: string, ym?: string): MonthUsage | null {
  const store = loadStore();
  const company = store.companies[companyId];
  if (!company) return null;
  return company.months[ym ?? yearMonth()] ?? null;
}

/** Retorna o uso de todos os meses de uma empresa. */
export function getCompanyUsage(companyId: string): CompanyUsage | null {
  return loadStore().companies[companyId] ?? null;
}

/** Retorna todos os registros de uso de todas as empresas. */
export function getAllCompanies(): Record<string, CompanyUsage> {
  return loadStore().companies;
}

/** Retorna o contador atual de uma operação no mês atual. */
export function getCounter(companyId: string, op: UsageOperation, ym?: string): number {
  const month = getMonthUsage(companyId, ym);
  if (!month) return 0;
  return month.counters[op] ?? 0;
}

/** Atualiza o plano de uma empresa. */
export function setCompanyPlan(companyId: string, plan: PlanKey): void {
  const store = loadStore();
  if (!store.companies[companyId]) {
    store.companies[companyId] = { company_id: companyId, plan, months: {} };
  } else {
    store.companies[companyId].plan = plan;
  }
  saveStore(store);
}

export { yearMonth };
