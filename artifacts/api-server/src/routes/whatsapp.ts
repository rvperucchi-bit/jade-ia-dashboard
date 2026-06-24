import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    req.log.info("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  req.log.warn({ mode, token }, "WhatsApp webhook verification failed — token mismatch or wrong mode");
  return res.sendStatus(403);
});

router.post("/webhook", (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];
  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = change.value as Record<string, unknown>;
      const messages = (value?.messages as Array<Record<string, unknown>>) ?? [];
      for (const msg of messages) {
        if (msg.type === "text") {
          const from = msg.from as string;
          const text = (msg.text as Record<string, string>)?.body ?? "";
          req.log.info({ from, text }, "WhatsApp message received");
        }
      }
    }
  }

  return res.sendStatus(200);
});

router.post("/send", async (req: Request, res: Response) => {
  const { to, message } = req.body as { to?: string; message?: string };

  if (!to || !message) {
    return res.status(400).json({ error: "Campos 'to' e 'message' são obrigatórios." });
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    req.log.error("WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TOKEN não configurados");
    return res.status(500).json({ error: "Variáveis de ambiente do WhatsApp não configuradas." });
  }

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    req.log.error({ status: response.status, data }, "Erro ao enviar mensagem WhatsApp");
    return res.status(response.status).json(data);
  }

  req.log.info({ to, status: response.status }, "Mensagem WhatsApp enviada");
  return res.status(200).json(data);
});

export default router;
