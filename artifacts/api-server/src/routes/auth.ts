import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

function makeToken(email: string): string {
  const secret = process.env.SESSION_SECRET ?? "jade-dev-secret";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
}

export function verifyToken(token: string): string | null {
  const secret = process.env.SESSION_SECRET ?? "jade-dev-secret";
  const email = process.env.JADE_EMAIL ?? "rodrigo@jadeia.com.br";
  const expected = crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
  if (token === expected) return email;
  return null;
}

router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }

  const validEmail = (process.env.JADE_EMAIL ?? "rodrigo@jadeia.com.br").toLowerCase();
  const validPassword = process.env.JADE_PASSWORD ?? "jade2026";

  if (email.trim().toLowerCase() !== validEmail || password !== validPassword) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = makeToken(email);
  return res.json({ token, email: validEmail, name: "Rodrigo Coral" });
});

router.post("/logout", (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

export default router;
