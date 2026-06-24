// Assembles JADE_SYSTEM_PROMPT in the exact same section order as the
// original monolithic constant in routes/jade.ts — zero behavioural change.
//
// Section order (preserved):
//   preamble → objections → language-rules → examples →
//   bant → identity → spin → whatsapp-blocks → footer

import { JADE_PREAMBLE, REGRAS_LINGUAGEM, EXEMPLOS, IDENTIDADE } from './jade-system.js';
import { OBJECOES } from './objections.js';
import { BANT } from './bant.js';
import { SPIN } from './spin.js';
import { WHATSAPP_BLOCKS } from './whatsapp.js';

export const JADE_SYSTEM_PROMPT = `
${JADE_PREAMBLE}

${OBJECOES}

${REGRAS_LINGUAGEM}

${EXEMPLOS}

${BANT}

${IDENTIDADE}

${SPIN}

${WHATSAPP_BLOCKS}

JADE IA v10.5 — Agente comercial ativa.
`;

// Re-export helpers needed by routes/jade.ts
export { getSegmentBlock, TOM_MAP, MODO_MAP } from './segments.js';
export { SEGMENT_SPECIALIST } from './segments.js';
