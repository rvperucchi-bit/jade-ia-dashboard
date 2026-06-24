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

export default router;
