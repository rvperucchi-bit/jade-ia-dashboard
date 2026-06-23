import { Router, Request, Response } from 'express';
import { getCompanyConfig, setCompanyConfig } from '../db/store.js';

const router = Router();

// GET /empresa — return current company config
router.get('/', (_req: Request, res: Response) => {
  const config = getCompanyConfig();
  return res.json({ config });
});

// POST /empresa — save company config
router.post('/', (req: Request, res: Response) => {
  const { nome, produto, segmento, tom, planos, cidade, estado, modoOperacao } = req.body as {
    nome?: string;
    produto?: string;
    segmento?: string;
    tom?: string;
    planos?: string;
    cidade?: string;
    estado?: string;
    modoOperacao?: string;
  };

  if (!nome?.trim() || !produto?.trim()) {
    return res.status(400).json({ error: 'nome e produto são obrigatórios' });
  }

  const config = setCompanyConfig({
    nome: nome.trim(),
    produto: produto.trim(),
    segmento: segmento?.trim() ?? 'Outro',
    tom: tom?.trim() ?? 'consultivo',
    planos: planos?.trim() ?? '',
    cidade: cidade?.trim() ?? '',
    estado: estado?.trim() ?? '',
    modoOperacao: modoOperacao?.trim() ?? 'fechamento',
  });

  return res.json({ ok: true, config });
});

export default router;
