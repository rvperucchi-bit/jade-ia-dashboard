---
name: Context Builder
description: lib/context/builder.ts — monta systemPrompt dinamicamente por perfil de operação com blocos selecionados e JADE Memory integrada.
---

## Regra
Usar `buildContextForOperation(profile, companyConfig?)` para montar systemPrompt — nunca concatenar blocos de prompt manualmente nas rotas.

## Perfis e blocos

| Perfil | Blocos incluídos |
|--------|-----------------|
| `chat` | JADE_PREAMBLE, OBJECOES, REGRAS_LINGUAGEM, EXEMPLOS, BANT, IDENTIDADE, SPIN, WHATSAPP_BLOCKS + full company memory |
| `marketing` | JADE_PREAMBLE + REGRAS_LINGUAGEM (minimal) + memória marketing (diferenciais, publicoAlvo, concorrentes, tom, planos) |
| `reports` | JADE_PREAMBLE + REGRAS_LINGUAGEM (minimal) + memória relatórios (metas, equipe, regrasComerciais) |
| `support` | JADE_PREAMBLE + REGRAS_LINGUAGEM (minimal) + memória atendimento (regrasComerciais, objeçõesComuns) |
| `lead-analysis` | systemPrompt vazio — usa raw prompt direto |

## Integração atual
- `routes/jade.ts` → `buildContextForOperation('chat', companyConfig)`
- `routes/marketing.ts` → prefixar prompt com `buildMarketingMemoryBlock(storedConfig)` (enriquecimento server-side)

## Exportações públicas
- `buildContextForOperation(profile, companyConfig?)` → `BuiltContext`
- `buildMarketingMemoryBlock(config)` → `string`
- `buildReportsMemoryBlock(config)` → `string`
- `buildSupportMemoryBlock(config)` → `string`
- `ContextProfile`, `BuiltContext` types

**Why:**
Contexto monolítico desperdiçava tokens e reduzia relevância das respostas. Builder garante que cada operação receba apenas o que precisa, mantendo fallback gracioso quando empresa não está cadastrada.

**How to apply:**
Ao criar nova rota com chamada à IA, escolher o perfil mais próximo ou criar novo em `ContextProfile`. Nunca importar blocos individuais de prompts diretamente nas rotas.
