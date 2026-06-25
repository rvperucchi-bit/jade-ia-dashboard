import { Router, Request, Response } from "express";
import { engine } from "../lib/ai/index.js";
import { addCampaign, getAllCampaigns, getCampaign, addActivityEvent, getCompanyConfig } from "../db/store.js";
import { buildMarketingMemoryBlock } from "../lib/context/builder.js";

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

  try {
    // Enrich with server-stored company memory (marketing profile: diferenciais,
    // publicoAlvo, tom). Falls back gracefully if no company is configured yet.
    const storedConfig = getCompanyConfig();
    const memoryBlock = storedConfig?.nome ? buildMarketingMemoryBlock(storedConfig) : '';
    const enrichedContext = memoryBlock
      ? `${memoryBlock}\n\n${system_context}`
      : system_context;

    const prompt = `${enrichedContext}\n\nContexto fornecido pelo usuário: ${context_input.trim()}`;
    const content = await engine.generate({ prompt, operation: 'marketing:generate' });

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

  // Enrich prompt with company context if available
  const storedConfig = getCompanyConfig();
  const enrichedPrompt = storedConfig?.nome
    ? `${prompt.trim()} — estilo profissional para a empresa ${storedConfig.nome} (${storedConfig.segmento ?? 'negócios'})`
    : prompt.trim();

  try {
    const result = await engine.generateImage({
      prompt: enrichedPrompt,
      size,
      quality,
    });

    addActivityEvent({
      type: "campaign",
      text: `Imagem gerada: ${prompt.trim().slice(0, 60)}${prompt.length > 60 ? '…' : ''}`,
      icon: "image",
      color: "#C9A24B",
    });

    req.log.info({ promptChars: prompt.length }, "marketing: image generated");
    return res.json({ url: result.url, revisedPrompt: result.revisedPrompt, model: "dall-e-3" });
  } catch (err) {
    req.log.error(err, "marketing: generate-image failed");
    return res.status(500).json({ error: "Falha ao gerar imagem.", detail: String(err) });
  }
});

export default router;
