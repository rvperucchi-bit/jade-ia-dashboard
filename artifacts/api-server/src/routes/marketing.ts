import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addCampaign, getAllCampaigns, getCampaign, addActivityEvent } from "../db/store.js";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${system_context}\n\nContexto fornecido pelo usuário: ${context_input.trim()}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

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

export default router;
