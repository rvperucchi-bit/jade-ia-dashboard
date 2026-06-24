import { TOM_MAP, MODO_MAP, getSegmentBlock } from '../prompts/index.js';
import type { CompanyConfig } from '../../db/store.js';

function line(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:** ${v}` : null;
}

function block(label: string, value: string | undefined): string | null {
  const v = value?.trim();
  return v ? `**${label}:**\n${v}` : null;
}

/**
 * Build the JADE Memory block injected into the system prompt for the main
 * chat operation. Includes all persisted company fields. Returns an empty
 * string if the config has no meaningful content.
 */
export function buildCompanyMemoryBlock(config: CompanyConfig): string {
  if (!config.nome?.trim()) return '';

  const parts: string[] = [
    '## MEMÓRIA DA EMPRESA (JADE Memory)',
    '',
    'Você tem acesso às informações persistentes da empresa do usuário.',
    'Use-as automaticamente em TODAS as respostas, estratégias e materiais — nunca peça dados que já estão aqui.',
    '',
  ];

  const coreLines = [
    line('Empresa', config.nome),
    line('Segmento', config.segmento),
    line(
      'Localização',
      [config.cidade, config.estado].filter(Boolean).join(' / ') || undefined,
    ),
    line('Produto / Serviço principal', config.produto),
    line('Tom de voz', TOM_MAP[config.tom] ?? config.tom),
    config.modoOperacao
      ? line('Modo de operação', MODO_MAP[config.modoOperacao] ?? config.modoOperacao)
      : null,
  ].filter(Boolean);

  parts.push(...(coreLines as string[]));

  if (config.planos?.trim()) {
    parts.push('', `**Produtos e planos:**\n${config.planos.trim()}`);
  }

  const extendedBlocks = [
    block('Público-alvo', config.publicoAlvo),
    block('Diferenciais competitivos', config.diferenciais),
    block('Objeções comuns dos clientes', config.objecoesComuns),
    block('Concorrentes principais', config.concorrentes),
    block('Metas e objetivos', config.metas),
    block('Equipe', config.equipe),
    block('Regras comerciais', config.regrasComerciais),
  ].filter(Boolean) as string[];

  if (extendedBlocks.length > 0) {
    parts.push('');
    parts.push(...extendedBlocks.flatMap((b) => [b, '']));
  }

  parts.push(
    'Use todas essas informações para personalizar respostas, argumentos de venda,',
    'estratégias e materiais criados para essa empresa. Nunca invente dados que não estão aqui.',
  );

  const specialistBlock = getSegmentBlock(config.segmento);
  if (specialistBlock) {
    parts.push('', specialistBlock);
  }

  return parts.join('\n');
}
