import { Router } from "express";

const router = Router();

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  segmento: string;
  metaMensal: number;
  metaLeads: number;
  realizado: number;
  avatarColor: string;
  ultimaAtividade: string;
}

const vendedores: Vendedor[] = [
  { id: "v1", nome: "Ana Paula",    email: "ana@empresa.com",     segmento: "PME",        metaMensal: 30000, metaLeads: 40, realizado: 36000, avatarColor: "#6C63FF", ultimaAtividade: "Hoje, 14h" },
  { id: "v2", nome: "Carlos Rocha", email: "carlos@empresa.com",  segmento: "Enterprise", metaMensal: 60000, metaLeads: 25, realizado: 34800, avatarColor: "#FF0080", ultimaAtividade: "Hoje, 10h" },
  { id: "v3", nome: "Mariana Lima", email: "mariana@empresa.com", segmento: "Varejo",     metaMensal: 25000, metaLeads: 50, realizado: 21250, avatarColor: "#00D68F", ultimaAtividade: "Ontem, 16h" },
  { id: "v4", nome: "Diego Nunes",  email: "diego@empresa.com",   segmento: "SaaS",       metaMensal: 45000, metaLeads: 30, realizado: 20250, avatarColor: "#FFB300", ultimaAtividade: "Ontem, 9h" },
];

router.get("/", (req, res) => {
  res.json({ vendedores });
});

router.post("/", (req, res) => {
  const { vendedor } = req.body as { vendedor: Vendedor };
  if (!vendedor?.id || !vendedor?.nome) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const existing = vendedores.findIndex((v) => v.id === vendedor.id);
  if (existing >= 0) {
    vendedores[existing] = vendedor;
  } else {
    vendedores.push(vendedor);
  }
  res.json({ success: true, vendedor });
});

router.get("/:id", (req, res) => {
  const v = vendedores.find((v) => v.id === req.params.id);
  if (!v) { res.status(404).json({ error: "Vendedor não encontrado" }); return; }
  res.json({ vendedor: v });
});

router.put("/:id", (req, res) => {
  const idx = vendedores.findIndex((v) => v.id === req.params.id);
  if (idx < 0) { res.status(404).json({ error: "Vendedor não encontrado" }); return; }
  vendedores[idx] = { ...vendedores[idx], ...req.body };
  res.json({ success: true, vendedor: vendedores[idx] });
});

export default router;
