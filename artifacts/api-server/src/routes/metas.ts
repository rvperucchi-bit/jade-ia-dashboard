import { Router } from "express";

const router = Router();

const metas = [
  { vendedorId: "v1", nome: "Ana Paula",    meta: 30000, realizado: 36000, forecast: 38000, leads: 38, conversao: 24 },
  { vendedorId: "v2", nome: "Carlos Rocha", meta: 60000, realizado: 34800, forecast: 42000, leads: 22, conversao: 12 },
  { vendedorId: "v3", nome: "Mariana Lima", meta: 25000, realizado: 21250, forecast: 24000, leads: 44, conversao: 18 },
  { vendedorId: "v4", nome: "Diego Nunes",  meta: 45000, realizado: 20250, forecast: 27000, leads: 28, conversao: 10 },
];

router.get("/", (req, res) => {
  const metaTotal     = metas.reduce((s, m) => s + m.meta, 0);
  const realizadoTotal = metas.reduce((s, m) => s + m.realizado, 0);
  const forecastTotal  = metas.reduce((s, m) => s + m.forecast, 0);
  res.json({ metas, metaTotal, realizadoTotal, forecastTotal });
});

router.put("/:vendedorId", (req, res) => {
  const idx = metas.findIndex((m) => m.vendedorId === req.params.vendedorId);
  if (idx < 0) { res.status(404).json({ error: "Vendedor não encontrado" }); return; }
  metas[idx] = { ...metas[idx], ...req.body };
  res.json({ success: true, meta: metas[idx] });
});

export default router;
