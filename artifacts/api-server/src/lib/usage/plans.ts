// ── Planos oficiais da JADE IA ───────────────────────────────────────────────
// Fonte única de verdade: limites mensais, preços e estimativas de custo OpenAI.
// Qualquer alteração de pricing deve ser feita APENAS aqui.

export type PlanKey = 'start' | 'pro' | 'enterprise';

export type UsageOperation =
  | 'chat'
  | 'radar'
  | 'audio'
  | 'image_generation'
  | 'vision'
  | 'document_analysis'
  | 'embeddings';

export interface PlanLimits {
  chat: number;
  radar: number;
  audio: number;           // minutos por mês
  image_generation: number;
  vision: number;
  document_analysis: number;
  embeddings: number;      // sem limite = Infinity
}

export interface PlanDefinition {
  key: PlanKey;
  label: string;
  price_brl: number;
  max_users: number;
  limits: PlanLimits;
  /** Custo estimado OpenAI por mês (mín) em R$ */
  cost_low_brl: number;
  /** Custo estimado OpenAI por mês (máx) em R$ */
  cost_high_brl: number;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  start: {
    key: 'start',
    label: 'Start',
    price_brl: 97,
    max_users: 1,
    limits: {
      chat:              500,
      radar:              50,
      audio:              30,
      image_generation:   10,
      vision:             20,
      document_analysis:  20,
      embeddings:         Infinity,
    },
    cost_low_brl:  15,
    cost_high_brl: 30,
  },

  pro: {
    key: 'pro',
    label: 'Pro',
    price_brl: 247,
    max_users: 3,
    limits: {
      chat:              2000,
      radar:              200,
      audio:              120,
      image_generation:    50,
      vision:             100,
      document_analysis:  100,
      embeddings:         Infinity,
    },
    cost_low_brl:  30,
    cost_high_brl: 60,
  },

  enterprise: {
    key: 'enterprise',
    label: 'Enterprise',
    price_brl: 697,
    max_users: 8,
    limits: {
      chat:              5000,
      radar:              500,
      audio:              300,
      image_generation:   200,
      vision:             500,
      document_analysis:  500,
      embeddings:         Infinity,
    },
    cost_low_brl:  80,
    cost_high_brl: 150,
  },
};

export const OPERATION_LABELS: Record<UsageOperation, string> = {
  chat:              'Mensagens IA',
  radar:             'Buscas Radar',
  audio:             'Áudio (min)',
  image_generation:  'Imagens geradas',
  vision:            'Análises Vision',
  document_analysis: 'Documentos IA',
  embeddings:        'Embeddings',
};

export const NEXT_PLAN: Partial<Record<PlanKey, PlanKey>> = {
  start: 'pro',
  pro:   'enterprise',
};

export function getPlan(key: PlanKey): PlanDefinition {
  return PLANS[key];
}

export function parsePlanKey(raw: string | undefined): PlanKey {
  if (raw === 'pro' || raw === 'enterprise') return raw;
  return 'start';
}

/** Retorna true se a operação tem limite finito neste plano */
export function hasLimit(plan: PlanKey, op: UsageOperation): boolean {
  return isFinite(PLANS[plan].limits[op]);
}
