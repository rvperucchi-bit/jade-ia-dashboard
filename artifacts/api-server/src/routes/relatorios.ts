import { Router, Request, Response } from 'express';

const router = Router();

// GET /relatorios/diario
router.get('/diario', (_req: Request, res: Response) => {
  const hoje = new Date().toISOString().split('T')[0];
  return res.json({
    date: hoje,
    metrics: {
      leads_abordados: 8,
      conversas_iniciadas: 5,
      propostas_enviadas: 2,
      fechamentos: 1,
    },
    activity_by_hour: [
      { hour: '08:00', contacts: 2 },
      { hour: '09:00', contacts: 5 },
      { hour: '10:00', contacts: 8 },
      { hour: '11:00', contacts: 6 },
      { hour: '12:00', contacts: 3 },
      { hour: '14:00', contacts: 7 },
      { hour: '15:00', contacts: 9 },
      { hour: '16:00', contacts: 4 },
      { hour: '17:00', contacts: 6 },
      { hour: '18:00', contacts: 2 },
    ],
  });
});

// GET /relatorios/semanal
router.get('/semanal', (_req: Request, res: Response) => {
  const hoje = new Date();
  const semanaStart = new Date(hoje);
  semanaStart.setDate(hoje.getDate() - 6);

  return res.json({
    period: {
      start: semanaStart.toISOString().split('T')[0],
      end: hoje.toISOString().split('T')[0],
    },
    metrics: {
      leads_totais:       { current: 42, previous: 38 },
      conversas:          { current: 31, previous: 28 },
      propostas:          { current: 14, previous: 11 },
      fechamentos:        { current: 6,  previous: 4  },
      receita_estimada:   { current: 18600, previous: 12400 },
    },
    top_leads: [
      { name: 'Lead #1', score: 88, status: 'Quente' },
      { name: 'Lead #2', score: 76, status: 'Em contato' },
      { name: 'Lead #3', score: 71, status: 'Respondeu' },
    ],
  });
});

export default router;
