---
name: Company Memory Embeddings
description: Arquitetura de embeddings para Company Memory — como é salvo, recuperado e injetado no Context Builder
---

## Regra

Embeddings da empresa ficam em `data/jade-memory.json` (arquivo separado do jade-state.json para não inflar o estado principal).

**Why:** vetores 1536-dim por chunk × N chunks × N empresas = arquivo grande; separado evita parse de todo o estado a cada requisição.

## Estrutura

```json
{ "companies": { "<md5(nome)[0:12]>": { "configUpdatedAt": "ISO", "chunks": [{ "text": "...", "embedding": [...1536] }] } } }
```

## Fluxo

1. `POST /api/empresa` → `setCompanyConfig()` → fire-and-forget: `buildCompanyChunks()` → `engine.embed()` → `saveCompanyEmbeddings()`
2. `POST /api/jade/chat` (Path C) → `isEmbeddingStale(nome, updated_at)`:
   - **stale**: lança background refresh (sem await) → responde sem embedding
   - **fresh**: `engine.embed([lastUserText])` → `retrieveRelevantChunks()` (cosine, topK=4, threshold=0.3) → passa chunks ao `buildContextForOperation('chat', config, chunks)`

## Context Builder

`buildContextForOperation(profile, config, retrievedChunks?)` — chunks entram como bloco `## CONTEXTO RECUPERADO` após a memória estruturada. Bloco `'embedding-retrieved'` adicionado ao array `blocks` para logging.

## How to apply

- Sempre que `setCompanyConfig` for chamado em novos routes, disparar o mesmo fire-and-forget de embeddings (copiar padrão de empresa.ts).
- `isEmbeddingStale` compara `configUpdatedAt` com `config.updated_at` — garantido que re-embeds ocorrem após qualquer edição de config.
- Se `engine.embed()` falhar (sem API key, quota, etc.), erro é capturado como warn e o chat continua sem embedding-retrieved (graceful degradation).
