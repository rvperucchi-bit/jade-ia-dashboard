---
name: JADE AI Engine
description: Camada central de IA em lib/ai/ que abstrai Gemini e Whisper; roteamento por provider, retry e logs centralizados
---

Localização: `artifacts/api-server/src/lib/ai/` (types, config, providers/gemini, providers/whisper, engine, index)

**Arquitetura:**
- `config.ts`: registro central de modelo/temp/tokens por `OperationName`; type guards `isGeminiConfig` / `isWhisperConfig`
- `engine.ts`: singleton `engine`; métodos `chat(ChatOptions)`, `generate(GenerateOptions)`, `transcribe(TranscribeOptions)`
- Roteamento real usa `config.provider` (não decide por nome de método), prevenindo casts inválidos
- `JadeAIConfigError` em `types.ts`: erros de misconfig que não são retried e surfaceiam 500 nas rotas

**Operações mapeadas:**
- `chat` (chat principal da JADE) → OpenAI (`gpt-4o-mini`, raw fetch /v1/chat/completions)
- `chat:lead-analysis`, `chat:prospectar`, `marketing:generate`, `approach` → Gemini
- `transcribe` → Whisper (OpenAI API raw fetch)

**Provider OpenAI** (`providers/openai.ts`):
- Usa `OPENAI_API_KEY` (mesma do Whisper); raw fetch com AbortController timeout 60s (erro contém 'timeout' → withRetry trata como transient)
- Normalização própria: system prompt primeiro, depois history user/assistant; role legado `model` → `assistant` (qualquer role != 'user' vira assistant)
- Config `OpenAIOperationConfig` usa `maxTokens` (≠ Gemini que usa `maxOutputTokens`)
- engine.chat()/generate() fazem dispatch por `config.provider` (isOpenAIConfig/isGeminiConfig)
- ROLLBACK para Gemini: trocar bloco `chat` em OPERATION_CONFIG de volta p/ gemini — sem tocar telas (há comentário no config.ts)
- Tipo `LLMOperationName` (antes `GeminiOperationName`) cobre ops chat+generate de qualquer provider

**JADE Memory** (`lib/memory/company.ts`):
- `buildCompanyMemoryBlock(config: CompanyConfig): string` — ponto único de montagem do bloco de memória no system prompt
- `CompanyConfig` (store.ts) tem 7 campos opcionais extras: publicoAlvo, diferenciais, objecoesComuns, concorrentes, metas, equipe, regrasComerciais
- Chat primary source: `getCompanyConfig()` servidor; backward compat: client-sent `company_config` no body como fallback
- Seção JADE MEMORY adicionada na tela empresa.tsx do mobile (campos multiline)
- `/api/empresa` POST aceita + salva todos os campos; nenhuma outra rota foi alterada

**Why:**
- Abstração para troca futura Gemini→OpenAI: criar `providers/openai.ts` + ajustar `engine.ts` + `config.ts`; rotas e telas não precisam ser tocadas
- retry: 1x após 1.5s em erros 5xx, 429, timeout; `JadeAIConfigError` não é retried
- API keys validadas em cada provider (`assertKey()`); aviso no logger ao init se ausentes

**Migrations restantes para OpenAI:**
- `/jade/chat` ainda usa Gemini (engine.chat)
- Próximo passo: adicionar `providers/openai.ts` e mudar config `chat` para `provider: 'openai'`
