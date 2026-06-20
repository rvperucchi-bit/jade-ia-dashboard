import { Router, Request, Response } from "express";

const router = Router();

interface PlanoItem {
  tipo: "compromisso" | "lead_quente" | "followup" | "meta";
  titulo: string;
  horario?: string;
  descricao?: string;
}

interface PlanoDia {
  userId: string;
  data: string;
  confirmado: boolean;
  itens: PlanoItem[];
  cronograma?: { horario: string; titulo: string; tipo: string }[];
  criadoEm: string;
  confirmadoEm?: string;
}

// In-memory store
const planos = new Map<string, PlanoDia>();

function dataHoje(): string {
  return new Date().toISOString().split("T")[0]!;
}

function gerarPlanoPadrao(userId: string): PlanoDia {
  const itens: PlanoItem[] = [
    { tipo: "compromisso", titulo: "Reunião com TechBrasil LTDA", horario: "09:00", descricao: "Apresentação da proposta Pro — Carlos Mendes" },
    { tipo: "lead_quente", titulo: "Follow-up com Inova Digital",  horario: "11:00", descricao: "18 dias sem contato — risco de perder para concorrente" },
    { tipo: "followup",    titulo: "LogiMax — reativação urgente", horario: "14:00", descricao: "35 dias sem contato — status em_risco" },
    { tipo: "meta",        titulo: "Meta do dia: R$ 5.200",        descricao: "Para atingir 100% da meta mensal você precisa fechar R$ 5.200 hoje" },
  ];

  return {
    userId,
    data: dataHoje(),
    confirmado: false,
    itens,
    criadoEm: new Date().toISOString(),
  };
}

// GET /api/planejamento/:userId/hoje
router.get("/:userId/hoje", (req: Request, res: Response) => {
  const userId = String(req.params["userId"] ?? "");
  const chave = `${userId}_${dataHoje()}`;
  const plano = planos.get(chave) ?? gerarPlanoPadrao(userId);
  res.json({ plano });
});

// POST /api/planejamento/:userId/hoje — confirm or update plan
router.post("/:userId/hoje", (req: Request, res: Response) => {
  const userId = String(req.params["userId"] ?? "");
  const { confirmado, itens, cronograma } = req.body as Partial<PlanoDia>;
  const chave = `${userId}_${dataHoje()}`;

  const existente = planos.get(chave) ?? gerarPlanoPadrao(userId);
  const atualizado: PlanoDia = {
    ...existente,
    ...(itens !== undefined && { itens }),
    ...(cronograma !== undefined && { cronograma }),
    confirmado: confirmado !== undefined ? !!confirmado : existente.confirmado,
    confirmadoEm: confirmado ? new Date().toISOString() : existente.confirmadoEm,
  };
  planos.set(chave, atualizado);
  res.json({ plano: atualizado });
});

export default router;
