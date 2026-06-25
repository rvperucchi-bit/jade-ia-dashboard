// ── Usage Engine ─────────────────────────────────────────────────────────────
// Controla limites, registra uso e calcula ROI por empresa/plano.

import {
  PLANS, NEXT_PLAN, OPERATION_LABELS,
  type PlanKey, type UsageOperation,
} from './plans.js';
import {
  recordUsageEvent, getMonthUsage, getCounter, getAllCompanies,
  type UsageEvent, type MonthUsage,
} from './store.js';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface LimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  upgradeHint?: string;
}

export interface RecordOptions {
  companyId: string;
  plan: PlanKey;
  operation: UsageOperation;
  user_id?: string;
  model?: string;
  tokens?: number;
  duration_ms?: number;
  /** Para operação 'audio': minutos consumidos */
  audio_minutes?: number;
  status?: 'ok' | 'error';
  error?: string;
}

export interface AlertItem {
  operation: UsageOperation;
  label: string;
  percentUsed: number;
  used: number;
  limit: number;
  level: '80' | '90' | '100';
}

export interface CompanyReport {
  company_id: string;
  plan: PlanKey;
  plan_label: string;
  year_month: string;
  usage: Array<{
    operation: UsageOperation;
    label: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    percentUsed: number | null;
  }>;
  roi: {
    revenue_brl: number;
    cost_low_brl: number;
    cost_high_brl: number;
    profit_low_brl: number;
    profit_high_brl: number;
    margin_low_pct: number;
    margin_high_pct: number;
  };
  alerts: AlertItem[];
  events_sample: UsageEvent[];
}

export interface GlobalSummary {
  year_month: string;
  total_companies: number;
  total_calls_by_operation: Record<UsageOperation, number>;
  cost_estimate_low_brl: number;
  cost_estimate_high_brl: number;
  revenue_total_brl: number;
  profit_low_brl: number;
  profit_high_brl: number;
  companies_near_limit: Array<{ company_id: string; plan: PlanKey; alerts: AlertItem[] }>;
  ai_errors_count: number;
  plan_breakdown: Record<PlanKey, number>;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function currentYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function calcAlerts(companyId: string, plan: PlanKey, ym: string): AlertItem[] {
  const planDef = PLANS[plan];
  const alerts: AlertItem[] = [];

  for (const [op, limit] of Object.entries(planDef.limits) as [UsageOperation, number][]) {
    if (!isFinite(limit)) continue;
    const used = getCounter(companyId, op, ym);
    const pct = Math.round((used / limit) * 100);
    if (pct >= 80) {
      alerts.push({
        operation: op,
        label: OPERATION_LABELS[op],
        percentUsed: pct,
        used,
        limit,
        level: pct >= 100 ? '100' : pct >= 90 ? '90' : '80',
      });
    }
  }

  return alerts;
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Verifica se a empresa ainda tem limite disponível para a operação.
 * Deve ser chamado ANTES de executar a operação de IA.
 */
export function checkLimit(
  companyId: string,
  plan: PlanKey,
  operation: UsageOperation,
  /** Para 'audio': quantidade de minutos que serão consumidos */
  amount = 1,
): LimitCheckResult {
  const planDef = PLANS[plan];
  const limit = planDef.limits[operation];

  if (!isFinite(limit)) {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity, percentUsed: 0 };
  }

  const ym = currentYM();
  const used = getCounter(companyId, operation, ym);
  const remaining = Math.max(0, limit - used);
  const percentUsed = Math.round((used / limit) * 100);
  const wouldExceed = used + amount > limit;

  if (wouldExceed) {
    const nextPlan = NEXT_PLAN[plan];
    const upgradeHint = nextPlan
      ? `Limite de ${OPERATION_LABELS[operation]} atingido no plano ${planDef.label}. Faça upgrade para o plano ${PLANS[nextPlan].label} para continuar.`
      : `Limite de ${OPERATION_LABELS[operation]} atingido no plano ${planDef.label}. Entre em contato para ampliar sua capacidade.`;

    return { allowed: false, used, limit, remaining, percentUsed, upgradeHint };
  }

  return { allowed: true, used, limit, remaining, percentUsed };
}

/**
 * Registra um evento de uso após execução bem-sucedida (ou com erro).
 * Chame sempre em try/finally ou após o resultado.
 */
export function recordUsage(opts: RecordOptions): void {
  recordUsageEvent(opts.companyId, opts.plan, {
    operation:     opts.operation,
    user_id:       opts.user_id,
    model:         opts.model,
    tokens:        opts.tokens,
    duration_ms:   opts.duration_ms,
    audio_minutes: opts.audio_minutes,
    status:        opts.status ?? 'ok',
    error:         opts.error,
  });
}

/**
 * Registra bloqueio por limite atingido (não incrementa contador).
 */
export function recordBlocked(companyId: string, plan: PlanKey, operation: UsageOperation): void {
  recordUsageEvent(companyId, plan, { operation, status: 'blocked' });
}

/**
 * Retorna o relatório completo de uma empresa para um mês.
 */
export function getCompanyReport(companyId: string, plan: PlanKey, ym?: string): CompanyReport {
  const yearMonth = ym ?? currentYM();
  const planDef = PLANS[plan];
  const month: MonthUsage | null = getMonthUsage(companyId, yearMonth);
  const counters = month?.counters ?? {
    chat: 0, radar: 0, audio: 0, image_generation: 0, vision: 0, document_analysis: 0, embeddings: 0,
  };

  const usage = (Object.keys(OPERATION_LABELS) as UsageOperation[]).map((op) => {
    const limit = planDef.limits[op];
    const used = counters[op] ?? 0;
    const hasLimit = isFinite(limit);
    return {
      operation: op,
      label: OPERATION_LABELS[op],
      used,
      limit: hasLimit ? limit : null,
      remaining: hasLimit ? Math.max(0, limit - used) : null,
      percentUsed: hasLimit ? Math.round((used / limit) * 100) : null,
    };
  });

  const roi = {
    revenue_brl:       planDef.price_brl,
    cost_low_brl:      planDef.cost_low_brl,
    cost_high_brl:     planDef.cost_high_brl,
    profit_low_brl:    planDef.price_brl - planDef.cost_high_brl,
    profit_high_brl:   planDef.price_brl - planDef.cost_low_brl,
    margin_low_pct:    Math.round(((planDef.price_brl - planDef.cost_high_brl) / planDef.price_brl) * 100),
    margin_high_pct:   Math.round(((planDef.price_brl - planDef.cost_low_brl) / planDef.price_brl) * 100),
  };

  const alerts = calcAlerts(companyId, plan, yearMonth);

  return {
    company_id: companyId,
    plan,
    plan_label: planDef.label,
    year_month: yearMonth,
    usage,
    roi,
    alerts,
    events_sample: (month?.events ?? []).slice(0, 50),
  };
}

/**
 * Retorna um resumo global de todas as empresas para um mês.
 */
export function getGlobalSummary(ym?: string): GlobalSummary {
  const yearMonth = ym ?? currentYM();
  const allCompanies = getAllCompanies();

  const totalCallsByOp: Record<UsageOperation, number> = {
    chat: 0, radar: 0, audio: 0, image_generation: 0, vision: 0, document_analysis: 0, embeddings: 0,
  };
  let costLow = 0;
  let costHigh = 0;
  let revTotal = 0;
  let errCount = 0;
  const nearLimit: Array<{ company_id: string; plan: PlanKey; alerts: AlertItem[] }> = [];
  const planBreakdown: Record<PlanKey, number> = { start: 0, pro: 0, enterprise: 0 };

  for (const [cid, company] of Object.entries(allCompanies)) {
    const plan = company.plan;
    const planDef = PLANS[plan];
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1;
    revTotal     += planDef.price_brl;
    costLow      += planDef.cost_low_brl;
    costHigh     += planDef.cost_high_brl;

    const month = company.months[yearMonth];
    if (month) {
      for (const [op, count] of Object.entries(month.counters) as [UsageOperation, number][]) {
        totalCallsByOp[op] = (totalCallsByOp[op] ?? 0) + count;
      }
      errCount += month.events.filter((e) => e.status === 'error').length;
    }

    const alerts = calcAlerts(cid, plan, yearMonth);
    if (alerts.length > 0) nearLimit.push({ company_id: cid, plan, alerts });
  }

  return {
    year_month:              yearMonth,
    total_companies:         Object.keys(allCompanies).length,
    total_calls_by_operation: totalCallsByOp,
    cost_estimate_low_brl:   costLow,
    cost_estimate_high_brl:  costHigh,
    revenue_total_brl:       revTotal,
    profit_low_brl:          revTotal - costHigh,
    profit_high_brl:         revTotal - costLow,
    companies_near_limit:    nearLimit,
    ai_errors_count:         errCount,
    plan_breakdown:          planBreakdown,
  };
}
