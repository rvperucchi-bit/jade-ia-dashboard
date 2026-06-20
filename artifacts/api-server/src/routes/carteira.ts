import { Router } from "express";

const router = Router();

interface Cliente {
  id: string;
  empresa: string;
  contato: string;
  responsavel: string;
  diasSemContato: number;
  tipo: "farmer" | "hunter";
  status: "em_dia" | "atencao" | "em_risco" | "inativo";
  ultimaInteracao: string;
  observacao?: string;
}

const clientes: Cliente[] = [
  { id: "c1", empresa: "TechBrasil LTDA", contato: "Carlos Mendes",    responsavel: "Ana Paula",    diasSemContato: 5,  tipo: "farmer", status: "em_dia",   ultimaInteracao: "16/06/2026" },
  { id: "c2", empresa: "Inova Digital",   contato: "Fernanda Souza",   responsavel: "Carlos Rocha", diasSemContato: 18, tipo: "farmer", status: "atencao",  ultimaInteracao: "02/06/2026" },
  { id: "c3", empresa: "LogiMax",         contato: "Roberto Lima",     responsavel: "Mariana Lima", diasSemContato: 35, tipo: "farmer", status: "em_risco", ultimaInteracao: "16/05/2026" },
  { id: "c4", empresa: "StartUp Hub",     contato: "Juliana Ferreira", responsavel: "Diego Nunes",  diasSemContato: 4,  tipo: "hunter", status: "em_dia",   ultimaInteracao: "17/06/2026" },
  { id: "c5", empresa: "FinTec Capital",  contato: "Pedro Rocha",      responsavel: "Ana Paula",    diasSemContato: 22, tipo: "hunter", status: "atencao",  ultimaInteracao: "29/05/2026" },
  { id: "c6", empresa: "Comercial Norte", contato: "Diego Alves",      responsavel: "Carlos Rocha", diasSemContato: 65, tipo: "farmer", status: "inativo",  ultimaInteracao: "17/04/2026" },
  { id: "c7", empresa: "EduTech Plus",    contato: "Beatriz Santos",   responsavel: "Mariana Lima", diasSemContato: 42, tipo: "farmer", status: "em_risco", ultimaInteracao: "09/05/2026" },
];

router.get("/", (req, res) => {
  res.json({ clientes });
});

router.post("/", (req, res) => {
  const cliente: Cliente = { ...req.body, id: "c" + Date.now() };
  clientes.push(cliente);
  res.json({ success: true, cliente });
});

router.post("/:id/visita", (req, res) => {
  const idx = clientes.findIndex((c) => c.id === req.params.id);
  if (idx < 0) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  const { observacao } = req.body as { observacao?: string };
  clientes[idx] = {
    ...clientes[idx],
    diasSemContato: 0,
    ultimaInteracao: new Date().toLocaleDateString("pt-BR"),
    status: "em_dia",
    observacao: observacao || clientes[idx].observacao,
  };
  res.json({ success: true, cliente: clientes[idx] });
});

export default router;
