import { Router } from "express";

const router = Router();

router.post("/gerar", async (req, res) => {
  const { vendedor, meta, realizado, pipeline, segmento } = req.body as {
    vendedor: string;
    meta: number;
    realizado: number;
    pipeline?: string;
    segmento?: string;
  };

  if (!vendedor || !meta) {
    res.status(400).json({ error: "Dados insuficientes para gerar feedback" });
    return;
  }

  const pct = meta ? Math.round((realizado / meta) * 100) : 0;
  const acima = pct >= 100;

  const systemPrompt = "Você é a JADE, mentora comercial empática e humana. NUNCA use linguagem de cobrança ou pressão. Sempre reconheça o esforço primeiro, identifique bloqueios com curiosidade genuína, sugira 3 ações concretas e práticas para esta semana, e termine com encorajamento genuíno. Máximo 4 parágrafos.";

  const userPrompt = acima
    ? `Vendedor: ${vendedor}. Atingiu ${pct}% da meta (R$${realizado}/R$${meta}). Segmento: ${segmento ?? "geral"}. Pipeline: ${pipeline ?? "n/d"}. Escreva uma mensagem de parabenização calorosa e genuína.`
    : `Vendedor: ${vendedor}. Está em ${pct}% da meta (R$${realizado}/R$${meta}). Segmento: ${segmento ?? "geral"}. Pipeline: ${pipeline ?? "n/d"}. Feedback empático, sem cobrança.`;

  res.json({
    prompt: `[SYSTEM: ${systemPrompt}]\n\n${userPrompt}`,
    meta: { vendedor, pct, acima },
  });
});

export default router;
