import { Router, Request, Response } from "express";

const router = Router();

interface Notificacao {
  id: string;
  mensagem: string;
  tipo: "informativo" | "urgente" | "motivacional";
  remetente: string;
  destinatarios: "todos" | string[];
  criadaEm: string;
  lida?: boolean;
}

const notificacoes: Notificacao[] = [];

// GET /api/notificacoes — list (vendedor view)
router.get("/", (_req: Request, res: Response) => {
  const para = [...notificacoes].reverse();
  res.json({ notificacoes: para });
});

// POST /api/notificacoes/time — gestor sends notification
router.post("/time", (req: Request, res: Response) => {
  const { mensagem, tipo, destinatarios } = req.body as {
    mensagem: string;
    tipo: "informativo" | "urgente" | "motivacional";
    destinatarios: "todos" | string[];
  };

  if (!mensagem?.trim()) {
    res.status(400).json({ error: "mensagem é obrigatória" });
    return;
  }

  const nova: Notificacao = {
    id: "n" + Date.now(),
    mensagem: mensagem.trim(),
    tipo: tipo ?? "informativo",
    remetente: "gestor",
    destinatarios: destinatarios ?? "todos",
    criadaEm: new Date().toISOString(),
    lida: false,
  };
  notificacoes.push(nova);
  res.status(201).json({ success: true, notificacao: nova });
});

export default router;
