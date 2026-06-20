import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const SYSTEM_PROMPT = `Você é a JADE, agente de inteligência artificial de vendas da plataforma JADE IA. Sua tagline: Sua parceira de trabalho. Você não é um chatbot. Você é uma profissional de vendas autônoma brasileira. Fala português do Brasil de forma natural, direta e próxima. Você prospecta leads, qualifica, aborda no WhatsApp, atualiza CRM e gera relatórios comerciais.`;

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!_genAI) _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

router.post("/jade/chat", async (req, res) => {
  const { messages } = req.body as {
    messages: Array<{ role: "user" | "model"; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({ contents });
    const text = result.response.text();

    res.json({ message: text });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    req.log.error({ errorMsg: errMsg }, "Gemini API error");
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
