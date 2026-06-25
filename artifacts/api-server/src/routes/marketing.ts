import { Router, Request, Response } from "express";
import { engine } from "../lib/ai/index.js";
import { addCampaign, getAllCampaigns, getCampaign, addActivityEvent, getCompanyConfig } from "../db/store.js";
import { buildMarketingMemoryBlock } from "../lib/context/builder.js";
import { checkLimit, recordUsage, recordBlocked, getAllCompanies, type PlanKey } from "../lib/usage/index.js";

function getUsageCtx(): { companyId: string; plan: PlanKey } {
  const config = getCompanyConfig();
  const companyId = config?.nome?.trim() || 'default';
  const plan: PlanKey = getAllCompanies()[companyId]?.plan ?? 'start';
  return { companyId, plan };
}

const router = Router();

// POST /api/marketing/generate
router.post("/generate", async (req: Request, res: Response) => {
  const { type_id, type_title, channel, context_input, system_context } = req.body as {
    type_id?: string;
    type_title?: string;
    channel?: string;
    context_input?: string;
    system_context?: string;
  };

  if (!context_input || !system_context) {
    return res.status(400).json({ error: "context_input e system_context são obrigatórios" });
  }

  // ── Usage: verificar limite de Chat (geração de texto usa mesmo limite) ───
  const genCtx = getUsageCtx();
  const genLimit = checkLimit(genCtx.companyId, genCtx.plan, 'chat');
  if (!genLimit.allowed) {
    recordBlocked(genCtx.companyId, genCtx.plan, 'chat');
    return res.status(429).json({
      error: 'Limite de mensagens IA atingido para este mês.',
      upgradeHint: genLimit.upgradeHint,
      used: genLimit.used, limit: genLimit.limit,
    });
  }

  try {
    // Enrich with server-stored company memory (marketing profile: diferenciais,
    // publicoAlvo, tom). Falls back gracefully if no company is configured yet.
    const storedConfig = getCompanyConfig();
    const memoryBlock = storedConfig?.nome ? buildMarketingMemoryBlock(storedConfig) : '';
    const enrichedContext = memoryBlock
      ? `${memoryBlock}\n\n${system_context}`
      : system_context;

    const prompt = `${enrichedContext}\n\nContexto fornecido pelo usuário: ${context_input.trim()}`;
    const t0 = Date.now();
    const content = await engine.generate({ prompt, operation: 'marketing:generate' });
    recordUsage({ companyId: genCtx.companyId, plan: genCtx.plan, operation: 'chat', model: 'gpt-5.4-mini', duration_ms: Date.now() - t0, status: 'ok' });

    const campaign = addCampaign({
      type_id: type_id ?? "custom",
      type_title: type_title ?? "Custom",
      channel: channel ?? "generic",
      context_input: context_input.trim(),
      generated_content: content,
      status: "draft",
    });

    addActivityEvent({
      type: "campaign",
      text: `Campanha criada: ${type_title ?? "Custom"} para ${channel ?? "canal"}`,
      icon: "zap",
      color: "#FFB300",
      metadata: { campaign_id: campaign.id, type: type_id },
    });

    return res.json({ campaign, message: content });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao gerar conteúdo", detail: String(error) });
  }
});

// GET /api/marketing/campaigns
router.get("/campaigns", (_req: Request, res: Response) => {
  const campaigns = getAllCampaigns();
  return res.json({ campaigns });
});

// GET /api/marketing/campaigns/:id
router.get("/campaigns/:id", (req: Request, res: Response) => {
  const campaign = getCampaign(String(req.params.id ?? ""));
  if (!campaign) return res.status(404).json({ error: "Campanha não encontrada" });
  return res.json({ campaign });
});

// ── POST /api/marketing/generate-image ────────────────────────────────────────
// Generates a marketing image via DALL-E 3 from a text prompt.
// Intended for future use in the Marketing module — no UI yet.
//
// Body: {
//   prompt: string,                                — image description (required)
//   size?: '1024x1024' | '1792x1024' | '1024x1792',
//   quality?: 'standard' | 'hd',
//   style?: 'vivid' | 'natural'
// }
// Response: { url: string, revisedPrompt: string, model: string }
router.post("/generate-image", async (req: Request, res: Response) => {
  const { prompt, size, quality } = req.body as {
    prompt?: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  };

  if (!prompt?.trim()) {
    return res.status(400).json({ error: "prompt é obrigatório." });
  }

  // ── Usage: verificar limite de Geração de Imagens ─────────────────────────
  const imgCtx = getUsageCtx();
  const imgLimit = checkLimit(imgCtx.companyId, imgCtx.plan, 'image_generation');
  if (!imgLimit.allowed) {
    recordBlocked(imgCtx.companyId, imgCtx.plan, 'image_generation');
    return res.status(429).json({
      error: 'Limite de geração de imagens atingido para este mês.',
      upgradeHint: imgLimit.upgradeHint,
      used: imgLimit.used, limit: imgLimit.limit,
    });
  }

  // Enrich prompt with company context if available
  const storedConfig = getCompanyConfig();
  const enrichedPrompt = storedConfig?.nome
    ? `${prompt.trim()} — estilo profissional para a empresa ${storedConfig.nome} (${storedConfig.segmento ?? 'negócios'})`
    : prompt.trim();

  try {
    const t0 = Date.now();
    const result = await engine.generateImage({
      prompt: enrichedPrompt,
      size,
      quality,
    });

    recordUsage({ companyId: imgCtx.companyId, plan: imgCtx.plan, operation: 'image_generation', model: 'gpt-image-1', duration_ms: Date.now() - t0, status: 'ok' });

    addActivityEvent({
      type: "campaign",
      text: `Imagem gerada: ${prompt.trim().slice(0, 60)}${prompt.length > 60 ? '…' : ''}`,
      icon: "image",
      color: "#C9A24B",
    });

    req.log.info({ promptChars: prompt.length }, "marketing: image generated");
    return res.json({ url: result.url, revisedPrompt: result.revisedPrompt, model: "gpt-image-1", isDataUri: result.isDataUri });
  } catch (err) {
    recordUsage({ companyId: imgCtx.companyId, plan: imgCtx.plan, operation: 'image_generation', model: 'gpt-image-1', status: 'error', error: String(err) });
    req.log.error(err, "marketing: generate-image failed");
    return res.status(500).json({ error: "Falha ao gerar imagem.", detail: String(err) });
  }
});

export default router;
