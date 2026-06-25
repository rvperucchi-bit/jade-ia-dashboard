/**
 * JADE Context Builder — central module that assembles only the prompt
 * blocks relevant to each operation profile, optionally enriched with
 * JADE Memory (persistent company config).
 *
 * Operation → blocks mapping:
 *   chat      → identity, objeções, linguagem, exemplos, bant, identidade,
 *               spin, whatsapp + full company memory
 *   marketing → identity (minimal), linguagem + marketing memory
 *               (diferenciais, publicoAlvo, tom)
 *   reports   → identity (minimal), linguagem + reports memory
 *               (metas, equipe, regrasComerciais)
 *   support   → identity (minimal), linguagem + support memory
 *               (regrasComerciais, processos)
 *   lead-analysis → empty system prompt (raw prompt only)
 */

import { JADE_PREAMBLE, REGRAS_LINGUAGEM, EXEMPLOS, IDENTIDADE } from '../prompts/jade-system.js';
import { OBJECOES } from '../prompts/objections.js';
import { BANT } from '../prompts/bant.js';
import { SPIN } from '../prompts/spin.js';
import { WHATSAPP_BLOCKS } from '../prompts/whatsapp.js';
import { TOM_MAP, MODO_MAP } from '../prompts/segments.js';
import { buildCompanyMemoryBlock } from '../memory/company.js';
import type { CompanyConfig } from '../../db/store.js';

// ── Cached base prompts ───────────────────────────────────────────────────────

/** Full commercial chat system prompt (no company memory — appended per request). */
const CHAT_BASE = [
  JADE_PREAMBLE,
  OBJECOES,
  REGRAS_LINGUAGEM,
  EXEMPLOS,
  BANT,
  IDENTIDADE,
  SPIN,
  WHATSAPP_BLOCKS,
  'JADE IA v10.5 — Agente comercial ativa.',
].join('\n\n');

/** Minimal identity used in non-chat operation prompts. */
const IDENTITY_BASE = [
  JADE_PREAMBLE,
  REGRAS_LINGUAGEM,
  'JADE IA v10.5 — Agente especializada.',
].join('\n\n');

// ── Internal memory block builders per profile ────────────────────────────────

function line(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:** ${v}` : null;
}

function block(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:**\n${v}` : null;
}

/**
 * Marketing-focused memory: identity + diferenciais + publicoAlvo + tom.
 * Excludes operational fields (metas, equipe, regrasComerciais) to keep the
 * marketing context lean and on-topic.
 */
export function buildMarketingMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = [
    '## CONTEXTO DA EMPRESA (personalização de conteúdo de marketing)',
    '',
  ];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line('Produto / Serviço principal', config.produto),
    line('Tom de voz', TOM_MAP[config.tom] ?? config.tom),
  ].filter(Boolean) as string[];

  parts.push(...coreLines);

  if (config.planos?.trim()) {
    parts.push('', `**Produtos e planos:**\n${config.planos.trim()}`);
  }

  const extendedBlocks = [
    block('Público-alvo', config.publicoAlvo),
    block('Diferenciais competitivos', config.diferenciais),
    block('Concorrentes principais', config.concorrentes),
  ].filter(Boolean) as string[];

  if (extendedBlocks.length > 0) {
    parts.push('');
    parts.push(...extendedBlocks.flatMap((b) => [b, '']));
  }

  parts.push('Use essas informações para personalizar o conteúdo de marketing para a empresa acima.');
  return parts.join('\n');
}

/**
 * Reports-focused memory: identity + metas + equipe + regrasComerciais.
 * Excludes marketing fields to keep context lean for analytical tasks.
 */
export function buildReportsMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = [
    '## CONTEXTO DA EMPRESA (análise e relatórios)',
    '',
  ];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line(
      'Localização',
      [config.cidade, config.estado].filter(Boolean).join(' / ') || undefined,
    ),
    config.modoOperacao
      ? line('Modo de operação', MODO_MAP[config.modoOperacao] ?? config.modoOperacao)
      : null,
  ].filter(Boolean) as string[];

  parts.push(...coreLines);

  if (config.planos?.trim()) {
    parts.push('', `**Produtos e planos:**\n${config.planos.trim()}`);
  }

  const extendedBlocks = [
    block('Metas e objetivos', config.metas),
    block('Equipe de vendas', config.equipe),
    block('Regras comerciais', config.regrasComerciais),
  ].filter(Boolean) as string[];

  if (extendedBlocks.length > 0) {
    parts.push('');
    parts.push(...extendedBlocks.flatMap((b) => [b, '']));
  }

  parts.push('Use essas informações para contextualizar a análise e os relatórios da empresa acima.');
  return parts.join('\n');
}

/**
 * Support-focused memory: empresa + regrasComerciais + processos.
 * Minimal — enough for atendimento / FAQ without polluting the context.
 */
export function buildSupportMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = [
    '## CONTEXTO DA EMPRESA (atendimento ao cliente)',
    '',
  ];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line('Produto / Serviço', config.produto),
    line('Tom de voz', TOM_MAP[config.tom] ?? config.tom),
  ].filter(Boolean) as string[];

  parts.push(...coreLines);

  const extendedBlocks = [
    block('Regras comerciais', config.regrasComerciais),
    block('Objeções comuns', config.objecoesComuns),
  ].filter(Boolean) as string[];

  if (extendedBlocks.length > 0) {
    parts.push('');
    parts.push(...extendedBlocks.flatMap((b) => [b, '']));
  }

  parts.push('Use essas informações para personalizar o atendimento ao cliente da empresa acima.');
  return parts.join('\n');
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type ContextProfile =
  | 'chat'
  | 'marketing'
  | 'reports'
  | 'support'
  | 'lead-analysis';

export interface BuiltContext {
  /** Assembled system prompt — pass directly to engine.chat() or prepend to generate prompt. */
  systemPrompt: string;
  /** Which profile was used (informational / for logging). */
  profile: ContextProfile;
  /**
   * Names of included block categories (informational / for logging).
   * Lets callers log which blocks were assembled without inspecting the prompt string.
   */
  blocks: string[];
}

/**
 * Central Context Builder.
 *
 * Given an operation profile and an optional company config, returns a
 * BuiltContext whose `systemPrompt` contains only the blocks relevant to
 * that profile. Falls back to full 'chat' context for unknown profiles.
 *
 * All profiles degrade gracefully when `companyConfig` is absent or has no
 * `nome` — they return a valid (though un-personalised) system prompt.
 */
export function buildContextForOperation(
  profile: ContextProfile,
  companyConfig?: CompanyConfig | null,
): BuiltContext {
  const config = companyConfig ?? null;

  switch (profile) {
    // ── chat: full commercial context ─────────────────────────────────────────
    case 'chat': {
      const blocks = [
        'identity', 'objeções', 'linguagem', 'exemplos',
        'bant', 'identidade', 'spin', 'whatsapp',
      ];
      let systemPrompt = CHAT_BASE;

      if (config?.nome) {
        const memBlock = buildCompanyMemoryBlock(config);
        if (memBlock) {
          systemPrompt = systemPrompt + '\n\n' + memBlock;
          blocks.push('company-memory-full');
        }
      }

      return { systemPrompt, profile, blocks };
    }

    // ── marketing: identity + marketing memory only ───────────────────────────
    case 'marketing': {
      const blocks = ['identity', 'linguagem'];
      let systemPrompt = IDENTITY_BASE;

      if (config?.nome) {
        const memBlock = buildMarketingMemoryBlock(config);
        if (memBlock) {
          systemPrompt = systemPrompt + '\n\n' + memBlock;
          blocks.push('company-memory-marketing');
        }
      }

      return { systemPrompt, profile, blocks };
    }

    // ── reports: identity + reports memory only ───────────────────────────────
    case 'reports': {
      const blocks = ['identity', 'linguagem'];
      let systemPrompt = IDENTITY_BASE;

      if (config?.nome) {
        const memBlock = buildReportsMemoryBlock(config);
        if (memBlock) {
          systemPrompt = systemPrompt + '\n\n' + memBlock;
          blocks.push('company-memory-reports');
        }
      }

      return { systemPrompt, profile, blocks };
    }

    // ── support: identity + support memory only ───────────────────────────────
    case 'support': {
      const blocks = ['identity', 'linguagem'];
      let systemPrompt = IDENTITY_BASE;

      if (config?.nome) {
        const memBlock = buildSupportMemoryBlock(config);
        if (memBlock) {
          systemPrompt = systemPrompt + '\n\n' + memBlock;
          blocks.push('company-memory-support');
        }
      }

      return { systemPrompt, profile, blocks };
    }

    // ── lead-analysis: no system prompt (raw prompt only) ─────────────────────
    case 'lead-analysis': {
      return { systemPrompt: '', profile, blocks: [] };
    }

    // ── fallback ──────────────────────────────────────────────────────────────
    default: {
      return buildContextForOperation('chat', companyConfig);
    }
  }
}
