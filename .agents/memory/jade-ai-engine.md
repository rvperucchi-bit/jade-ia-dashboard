---
name: JADE AI Engine — OpenAI
description: Configuração atual do motor de IA — providers, modelos e operações após migração Gemini→OpenAI completa
---

## Regra

Todo o núcleo de IA da JADE roda em OpenAI. Gemini está isolado em `providers/gemini.ts` e NÃO é importado pelo engine.

**Why:** decisão de produto de unificar em OpenAI para controle, billing e capacidades (embeddings, whisper, gpt-4.1-mini).

## Modelos por operação (OPERATION_CONFIG em config.ts)

| Operação | Provider | Modelo | Uso |
|---|---|---|---|
| `chat` | openai | gpt-4.1-mini | Chat principal JADE |
| `chat:lead-analysis` | openai | gpt-4o-mini | Análise de lead no radar |
| `chat:prospectar` | openai | gpt-4o-mini | Leads fictícios /prospectar |
| `marketing:generate` | openai | gpt-4o-mini | Conteúdo de marketing |
| `approach` | openai | gpt-4o-mini | Mensagem WhatsApp de abordagem |
| `embed` | openai-embedding | text-embedding-3-small | Company Memory (1536 dims) |
| `transcribe` | whisper | gpt-4o-transcribe | Áudio → texto |

## Estrutura de arquivos

```
lib/ai/
  config.ts       — OPERATION_CONFIG, type guards (isOpenAIConfig, isOpenAIEmbeddingConfig, isWhisperConfig)
  types.ts        — ChatOptions, GenerateOptions, EmbedOptions, TranscribeOptions, JadeAIConfigError
  engine.ts       — JadeAIEngine (chat/generate/embed/transcribe), singleton engine
  index.ts        — barrel export
  providers/
    openai.ts     — chat(), generate(), embed() (raw fetch, sem SDK)
    whisper.ts    — transcribe() via /v1/audio/transcriptions
    gemini.ts     — ISOLADO, não importado pelo engine, mantido para rollback
```

## Company Memory flow

- `POST /empresa` → fire-and-forget: buildCompanyChunks → engine.embed → saveCompanyEmbeddings em `data/jade-memory.json`
- `POST /jade/chat` Path C → isEmbeddingStale? → lazy refresh (void) OR embed query → retrieveRelevantChunks (cosine topK=4) → buildContextForOperation('chat', config, chunks)

## How to apply

- Para mudar modelo do chat: alterar `chat.model` em `OPERATION_CONFIG` — zero mudança no resto.
- Para rollback a Gemini: reintroduzir GeminiOperationConfig em config.ts + re-importar GeminiProvider no engine.
- `OPENAI_API_KEY` é o único secret necessário para o núcleo.
- `engine.embed()` retorna `number[][]` — um vetor por texto, na mesma ordem da entrada.
- Erros de embedding são capturados como warn — chat continua sem retrieved chunks (graceful degradation).
