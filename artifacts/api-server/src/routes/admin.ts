// ── /api/admin — Dashboard administrativo interno ────────────────────────────
// Endpoints para monitorar uso, custos e ROI por empresa/plano.
// Sem autenticação por ora — uso interno/dev apenas.

import { Router, Request, Response } from 'express';
import {
  getCompanyReport,
  getGlobalSummary,
  setCompanyPlan,
  getAllCompanies,
  parsePlanKey,
  PLANS,
  type PlanKey,
} from '../lib/usage/index.js';
import { getCompanyConfig } from '../db/store.js';

const router = Router();

// ── GET /api/admin/usage ─────────────────────────────────────────────────────
// Resumo global: custo total, chamadas por operação, empresas perto do limite.
// Query: ?month=YYYY-MM (default: mês atual)
router.get('/usage', (_req: Request, res: Response) => {
  const ym = (typeof _req.query['month'] === 'string' ? _req.query['month'] : undefined);
  const summary = getGlobalSummary(ym);
  return res.json({ ok: true, summary });
});

// ── GET /api/admin/usage/:companyId ─────────────────────────────────────────
// Relatório completo de uma empresa: uso por operação, ROI e alertas.
// Query: ?month=YYYY-MM  (default: mês atual)
//        ?plan=start|pro|enterprise  (sobrescreve o plano salvo, para simulação)
router.get('/usage/:companyId', (req: Request, res: Response) => {
  const companyId = decodeURIComponent(String(req.params['companyId'] ?? ''));
  if (!companyId) return res.status(400).json({ error: 'companyId obrigatório' });

  const ym = (typeof req.query['month'] === 'string' ? req.query['month'] : undefined);
  const planOverride = (typeof req.query['plan'] === 'string' ? parsePlanKey(req.query['plan']) : undefined);

  // Descobrir plano: query param > salvo no store > default 'start'
  const allCompanies = getAllCompanies();
  const saved = allCompanies[companyId];
  const plan: PlanKey = planOverride ?? saved?.plan ?? 'start';

  const report = getCompanyReport(companyId, plan, ym);
  return res.json({ ok: true, report });
});

// ── GET /api/admin/usage-current ────────────────────────────────────────────
// Atalho: retorna o relatório da empresa atualmente configurada no servidor.
router.get('/usage-current', (req: Request, res: Response) => {
  const config = getCompanyConfig();
  if (!config?.nome) {
    return res.status(404).json({
      error: 'Nenhuma empresa configurada. Configure em POST /api/empresa primeiro.',
    });
  }

  const ym = (typeof req.query['month'] === 'string' ? req.query['month'] : undefined);
  const allCompanies = getAllCompanies();
  const plan: PlanKey = allCompanies[config.nome]?.plan ?? 'start';
  const report = getCompanyReport(config.nome, plan, ym);

  return res.json({ ok: true, company: config.nome, report });
});

// ── POST /api/admin/usage/:companyId/plan ────────────────────────────────────
// Define ou atualiza o plano de uma empresa.
// Body: { plan: 'start' | 'pro' | 'enterprise' }
router.post('/usage/:companyId/plan', (req: Request, res: Response) => {
  const companyId = decodeURIComponent(String(req.params['companyId'] ?? ''));
  const { plan } = req.body as { plan?: string };

  if (!companyId) return res.status(400).json({ error: 'companyId obrigatório' });
  if (!plan || !['start', 'pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'plan deve ser: start, pro ou enterprise' });
  }

  const planKey = parsePlanKey(plan);
  setCompanyPlan(companyId, planKey);

  return res.json({
    ok: true,
    company_id: companyId,
    plan: planKey,
    plan_def: PLANS[planKey],
  });
});

// ── GET /api/admin/plans ─────────────────────────────────────────────────────
// Retorna a tabela completa de planos (limites, preços, estimativas).
router.get('/plans', (_req: Request, res: Response) => {
  return res.json({ ok: true, plans: PLANS });
});

// ── GET /api/admin/roi ───────────────────────────────────────────────────────
// Tabela de ROI de todas as empresas no mês atual.
router.get('/roi', (req: Request, res: Response) => {
  const ym = (typeof req.query['month'] === 'string' ? req.query['month'] : undefined);
  const allCompanies = getAllCompanies();

  const rows = Object.entries(allCompanies).map(([cid, company]) => {
    const report = getCompanyReport(cid, company.plan, ym);
    return {
      company_id: cid,
      plan: company.plan,
      plan_label: report.plan_label,
      ...report.roi,
      alerts_count: report.alerts.length,
    };
  });

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      revenue_brl:     acc.revenue_brl     + r.revenue_brl,
      cost_low_brl:    acc.cost_low_brl    + r.cost_low_brl,
      cost_high_brl:   acc.cost_high_brl   + r.cost_high_brl,
      profit_low_brl:  acc.profit_low_brl  + r.profit_low_brl,
      profit_high_brl: acc.profit_high_brl + r.profit_high_brl,
    }),
    { revenue_brl: 0, cost_low_brl: 0, cost_high_brl: 0, profit_low_brl: 0, profit_high_brl: 0 },
  );

  return res.json({ ok: true, year_month: ym ?? 'current', companies: rows, totals });
});

export default router;
