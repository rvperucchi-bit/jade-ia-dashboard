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
- `chat`, `chat:lead-analysis`, `chat:prospectar`, `marketing:generate`, `approach` → Gemini
- `transcribe` → Whisper (OpenAI API raw fetch)

**Why:**
- Abstração para troca futura Gemini→OpenAI: criar `providers/openai.ts` + ajustar `engine.ts` + `config.ts`; rotas e telas não precisam ser tocadas
- retry: 1x após 1.5s em erros 5xx, 429, timeout; `JadeAIConfigError` não é retried
- API keys validadas em cada provider (`assertKey()`); aviso no logger ao init se ausentes

**Migrations restantes para OpenAI:**
- `/jade/chat` ainda usa Gemini (engine.chat)
- Próximo passo: adicionar `providers/openai.ts` e mudar config `chat` para `provider: 'openai'`
