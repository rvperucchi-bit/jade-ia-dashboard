import { Router, Request, Response } from 'express';
import { getCompanyConfig, setCompanyConfig } from '../db/store.js';
import { buildCompanyChunks, saveCompanyEmbeddings } from '../lib/memory/company.js';
import { engine } from '../lib/ai/index.js';

const router = Router();

// GET /empresa — return current company config
router.get('/', (_req: Request, res: Response) => {
  const config = getCompanyConfig();
  return res.json({ config });
});

// POST /empresa — save company config and refresh Company Memory embeddings
router.post('/', async (req: Request, res: Response) => {
  const {
    nome, produto, segmento, tom, planos,
    cidade, estado, modoOperacao,
    publicoAlvo, diferenciais, objecoesComuns,
    concorrentes, metas, equipe, regrasComerciais,
  } = req.body as {
    nome?: string;
    produto?: string;
    segmento?: string;
    tom?: string;
    planos?: string;
    cidade?: string;
    estado?: string;
    modoOperacao?: string;
    publicoAlvo?: string;
    diferenciais?: string;
    objecoesComuns?: string;
    concorrentes?: string;
    metas?: string;
    equipe?: string;
    regrasComerciais?: string;
  };

  if (!nome?.trim() || !produto?.trim()) {
    return res.status(400).json({ error: 'nome e produto são obrigatórios' });
  }

  const config = setCompanyConfig({
    nome:             nome.trim(),
    produto:          produto.trim(),
    segmento:         segmento?.trim()          ?? 'Outro',
    tom:              tom?.trim()               ?? 'consultivo',
    planos:           planos?.trim()            ?? '',
    cidade:           cidade?.trim()            ?? '',
    estado:           estado?.trim()            ?? '',
    modoOperacao:     modoOperacao?.trim()      ?? 'fechamento',
    publicoAlvo:      publicoAlvo?.trim()       ?? undefined,
    diferenciais:     diferenciais?.trim()      ?? undefined,
    objecoesComuns:   objecoesComuns?.trim()    ?? undefined,
    concorrentes:     concorrentes?.trim()      ?? undefined,
    metas:            metas?.trim()             ?? undefined,
    equipe:           equipe?.trim()            ?? undefined,
    regrasComerciais: regrasComerciais?.trim()  ?? undefined,
  });

  // Fire-and-forget: refresh Company Memory embeddings after config save.
  // Response is not delayed — embedding runs in background.
  void (async () => {
    try {
      const chunks = buildCompanyChunks(config);
      if (chunks.length === 0) return;
      const embeddings = await engine.embed({ texts: chunks });
      saveCompanyEmbeddings(config, chunks, embeddings);
      req.log.info(
        { company: config.nome, chunks: chunks.length },
        'jade-memory: embeddings refreshed after config save',
      );
    } catch (err) {
      req.log.warn({ err }, 'jade-memory: embedding refresh failed (non-fatal)');
    }
  })();

  return res.json({ ok: true, config });
});

export default router;
