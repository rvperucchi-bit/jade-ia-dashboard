---
name: Usage Engine
description: Módulo de controle de uso, limites por plano, custos e ROI da JADE IA
---

## Localização
- `artifacts/api-server/src/lib/usage/` — plans.ts, store.ts, engine.ts, index.ts
- `artifacts/api-server/data/jade-usage.json` — persistência separada do jade-state.json
- `artifacts/api-server/src/routes/admin.ts` — endpoints administrativos em /api/admin

## Planos (fonte única: plans.ts)
- start (R$97): chat=500, radar=50, audio=30min, img=10, vision=20, doc=20
- pro (R$247): chat=2000, radar=200, audio=120min, img=50, vision=100, doc=100
- enterprise (R$697): chat=5000, radar=500, audio=300min, img=200, vision=500, doc=500
- embeddings: Infinity em todos os planos

## Integração nas rotas
checkLimit() ANTES → bloqueia com 429 se atingido
recordUsage() APÓS → incrementa contador e grava evento

Rotas integradas: jade/chat (chat+radar), jade/transcribe (audio), jade/analyze-image (vision),
jade/read-file (vision OU document_analysis), marketing/generate (chat), marketing/generate-image (image_generation)

## Identificação da empresa
companyId = getCompanyConfig()?.nome?.trim() || 'default'
Plano da empresa: getAllCompanies()[companyId]?.plan ?? 'start'
Para definir plano: POST /api/admin/usage/:companyId/plan { plan: 'start'|'pro'|'enterprise' }

## Alertas
calcAlerts() emite nível '80' | '90' | '100' para operações com percentUsed ≥ 80
Visíveis em: GET /api/admin/usage (companies_near_limit) e GET /api/admin/usage/:companyId (alerts[])

## **Why:**
Necessário para não oferecer IA ilimitada — toda chamada de IA deve ser rastreada e limitada por plano.
Mantido separado do jade-state.json para isolar concerns e evitar conflito de escritas.

## **How to apply:**
Antes de adicionar nova rota IA: importar checkLimit/recordUsage de lib/usage/index.js,
chamar getUsageCtx() para obter companyId+plan, verificar limite e registrar uso.
