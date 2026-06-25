/**
 * JADE Context Builder — assembles only the prompt blocks relevant to each
 * operation profile, enriched with JADE Memory (persistent company config
 * and optional embedding-retrieved chunks).
 *
 * Operation → blocks mapping:
 *   chat      → identity, objeções, linguagem, exemplos, bant, identidade,
 *               spin, whatsapp + full company memory + retrieved chunks
 *   marketing → identity (minimal), linguagem + marketing memory
 *   reports   → identity (minimal), linguagem + reports memory
 *   support   → identity (minimal), linguagem + support memory
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

const IDENTITY_BASE = [
  JADE_PREAMBLE,
  REGRAS_LINGUAGEM,
  'JADE IA v10.5 — Agente especializada.',
].join('\n\n');

// ── Internal memory block builders ────────────────────────────────────────────

function line(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:** ${v}` : null;
}

function block(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:**\n${v}` : null;
}

export function buildMarketingMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = ['## CONTEXTO DA EMPRESA (personalização de conteúdo de marketing)', ''];

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

export function buildReportsMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = ['## CONTEXTO DA EMPRESA (análise e relatórios)', ''];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line('Localização', [config.cidade, config.estado].filter(Boolean).join(' / ') || undefined),
    config.modoOperacao ? line('Modo de operação', MODO_MAP[config.modoOperacao] ?? config.modoOperacao) : null,
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

export function buildSupportMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = ['## CONTEXTO DA EMPRESA (atendimento ao cliente)', ''];

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
  systemPrompt: string;
  profile: ContextProfile;
  blocks: string[];
}

/**
 * Central Context Builder.
 *
 * @param profile       Which operation context to build.
 * @param companyConfig Persistent company config (from JADE Memory store).
 * @param retrievedChunks Optional embedding-retrieved memory chunks relevant
 *                        to the current user query. When provided, these are
 *                        appended after the structured memory block so the
 *                        model gets the most contextually relevant facts first.
 */
export function buildContextForOperation(
  profile: ContextProfile,
  companyConfig?: CompanyConfig | null,
  retrievedChunks?: string[],
): BuiltContext {
  const config = companyConfig ?? null;

  switch (profile) {
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

      if (retrievedChunks && retrievedChunks.length > 0) {
        systemPrompt =
          systemPrompt +
          '\n\n## CONTEXTO RECUPERADO (relevante para esta mensagem)\n\n' +
          retrievedChunks.join('\n\n');
        blocks.push('embedding-retrieved');
      }

      return { systemPrompt, profile, blocks };
    }

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

    case 'lead-analysis':
      return { systemPrompt: '', profile, blocks: [] };

    default:
      return buildContextForOperation('chat', companyConfig, retrievedChunks);
  }
}
