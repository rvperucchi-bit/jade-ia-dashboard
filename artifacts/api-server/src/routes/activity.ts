import { Router, Request, Response } from "express";
import { addActivityEvent, getActivityEvents } from "../db/store.js";

const router = Router();

// GET /api/activity
router.get("/", (_req: Request, res: Response) => {
  const limit = parseInt(String(_req.query["limit"] ?? "20"), 10);
  const events = getActivityEvents(limit);
  return res.json({ events });
});

// POST /api/activity — mobile can push events here
router.post("/", (req: Request, res: Response) => {
  const { type, text, icon, color, metadata } = req.body as {
    type?: string;
    text?: string;
    icon?: string;
    color?: string;
    metadata?: Record<string, unknown>;
  };

  if (!type || !text) {
    return res.status(400).json({ error: "type e text são obrigatórios" });
  }

  const event = addActivityEvent({
    type: type as Parameters<typeof addActivityEvent>[0]["type"],
    text,
    icon: icon ?? "activity",
    color: color ?? "#FF0080",
    metadata,
  });

  return res.status(201).json({ event });
});

export default router;
