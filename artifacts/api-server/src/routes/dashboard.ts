import { Router, Request, Response } from "express";

const router = Router();

// GET /api/dashboard/gestor — Consolidated manager dashboard data
router.get("/gestor", (_req: Request, res: Response) => {
  const time = [
    { id: "v1", nome: "Ana Paula",    segmento: "PME",        metaMensal: 30000, metaLeads: 40, realizado: 36000, leads: 42, visitas: 8, ultimaAtividade: "Hoje, 14h",   planejamentoConfirmado: true  },
    { id: "v2", nome: "Carlos Rocha", segmento: "Enterprise", metaMensal: 60000, metaLeads: 25, realizado: 34800, leads: 27, visitas: 5, ultimaAtividade: "Hoje, 10h",   planejamentoConfirmado: true  },
    { id: "v3", nome: "Mariana Lima", segmento: "Varejo",     metaMensal: 25000, metaLeads: 50, realizado: 21250, leads: 33, visitas: 11,ultimaAtividade: "Ontem, 16h",  planejamentoConfirmado: false },
    { id: "v4", nome: "Diego Nunes",  segmento: "SaaS",       metaMensal: 45000, metaLeads: 30, realizado: 20250, leads: 18, visitas: 3, ultimaAtividade: "Ontem, 9h",   planejamentoConfirmado: false },
  ];

  const pipeline_consolidado = {
    novo:       time.reduce((s, v) => s + Math.round(v.leads * 0.3), 0),
    qualificado:time.reduce((s, v) => s + Math.round(v.leads * 0.25), 0),
    proposta:   time.reduce((s, v) => s + Math.round(v.leads * 0.25), 0),
    fechado:    time.reduce((s, v) => s + Math.round(v.leads * 0.2), 0),
  };

  const total_receita = time.reduce((s, v) => s + v.realizado, 0);
  const meta_time     = time.reduce((s, v) => s + v.metaMensal, 0);
  const percentual_atingido = meta_time > 0 ? Math.round((total_receita / meta_time) * 100) : 0;

  const alertas: { tipo: string; mensagem: string; vendedor?: string }[] = [];

  // Vendedores abaixo de 50%
  time.forEach((v) => {
    const pct = v.metaMensal > 0 ? Math.round((v.realizado / v.metaMensal) * 100) : 0;
    if (pct < 50) alertas.push({ tipo: "meta_baixa", mensagem: `${v.nome} está em ${pct}% da meta mensal`, vendedor: v.id });
  });

  // Vendedores sem planejamento
  time.filter((v) => !v.planejamentoConfirmado).forEach((v) => {
    alertas.push({ tipo: "sem_planejamento", mensagem: `${v.nome} ainda não confirmou o planejamento do dia`, vendedor: v.id });
  });

  res.json({
    time,
    pipeline_consolidado,
    total_receita,
    meta_time,
    percentual_atingido,
    alertas,
    atualizado_em: new Date().toISOString(),
  });
});

export default router;
