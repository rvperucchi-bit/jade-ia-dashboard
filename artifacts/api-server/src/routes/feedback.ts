import { Router, Request, Response } from "express";

const router = Router();

// ── Existing feedback/gerar route ──────────────────────────────────────────
router.post("/gerar", async (req: Request, res: Response) => {
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

// ── Feedback do Executivo (check-in diário de humor) ──────────────────────

interface FeedbackExecutivo {
  id: string;
  userId: string;
  userName: string;
  humor: "otimo" | "ok" | "dificil" | "ideia";
  texto?: string;
  data: string;
  createdAt: string;
}

const feedbacksExecutivo: FeedbackExecutivo[] = [
  { id: "fe1", userId: "u1", userName: "Ana Paula",    humor: "otimo",   texto: "Fechei 2 contratos hoje!", data: new Date().toISOString().split("T")[0]!, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "fe2", userId: "u2", userName: "Carlos Rocha", humor: "ok",      texto: undefined,                   data: new Date().toISOString().split("T")[0]!, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "fe3", userId: "u3", userName: "Mariana Lima", humor: "dificil", texto: "Travei em objeções hoje.",   data: new Date(Date.now() - 86400000).toISOString().split("T")[0]!, createdAt: new Date(Date.now() - 90000000).toISOString() },
  { id: "fe4", userId: "u3", userName: "Mariana Lima", humor: "dificil", texto: "Semana difícil.",            data: new Date(Date.now() - 172800000).toISOString().split("T")[0]!, createdAt: new Date(Date.now() - 180000000).toISOString() },
];

// GET /feedback-executivo — aggregated view for manager
router.get("/executivo", (_req: Request, res: Response) => {
  const today = new Date().toISOString().split("T")[0]!;

  const todayFeedbacks = feedbacksExecutivo.filter((f) => f.data === today);

  const humors = { otimo: 0, ok: 0, dificil: 0, ideia: 0 };
  feedbacksExecutivo.forEach((f) => {
    humors[f.humor] = (humors[f.humor] ?? 0) + 1;
  });

  // Detect consecutive "dificil" by user
  const alertas: { userName: string; dias: number }[] = [];
  const byUser = new Map<string, FeedbackExecutivo[]>();
  feedbacksExecutivo.forEach((f) => {
    if (!byUser.has(f.userId)) byUser.set(f.userId, []);
    byUser.get(f.userId)!.push(f);
  });
  byUser.forEach((fbs, _uid) => {
    const sorted = [...fbs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    let consecutivos = 0;
    for (const fb of sorted) {
      if (fb.humor === "dificil") consecutivos++;
      else break;
    }
    if (consecutivos >= 2 && sorted[0]) {
      alertas.push({ userName: sorted[0].userName, dias: consecutivos });
    }
  });

  return res.json({
    today: todayFeedbacks,
    all: feedbacksExecutivo.slice().reverse(),
    humors,
    alertas,
    responderam: todayFeedbacks.length,
    totalTime: 4,
  });
});

// POST /feedback-executivo — submit daily check-in
router.post("/executivo", (req: Request, res: Response) => {
  const { userId = "u_current", userName = "Você", humor, texto } = req.body as {
    userId?: string;
    userName?: string;
    humor: FeedbackExecutivo["humor"];
    texto?: string;
  };

  if (!humor) {
    return res.status(400).json({ error: "humor is required" });
  }

  const today = new Date().toISOString().split("T")[0]!;
  const existing = feedbacksExecutivo.findIndex((f) => f.userId === userId && f.data === today);
  const fb: FeedbackExecutivo = {
    id: `fe_${Date.now()}`,
    userId,
    userName,
    humor,
    texto: texto?.trim() || undefined,
    data: today,
    createdAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    feedbacksExecutivo[existing] = fb;
  } else {
    feedbacksExecutivo.push(fb);
  }

  return res.status(201).json({ ok: true, feedback: fb });
});

export default router;
