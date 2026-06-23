---
name: Audit PDF Convention
description: Ao terminar qualquer sessão de trabalho (work session), gerar um PDF de auditoria e apresentar ao usuário para download usando present_asset.
---

## Regra

Sempre que uma sessão de trabalho for concluída, gerar um PDF de auditoria com:
- Data/hora da sessão
- Objetivo da sessão
- Lista de alterações realizadas (arquivos, funções, comportamentos)
- Itens validados (TypeScript, testes, logs)
- Status final

## Como gerar

Usar `code_execution` com `pdfkit` via `await import('pdfkit')` para gerar o PDF em `/home/runner/workspace/exports/audit-<data>.pdf`.

**Why:** O usuário quer rastreabilidade de cada sessão de trabalho em formato portátil (PDF).

**How to apply:** No final de TODA sessão de trabalho com entregas concluídas, gerar e apresentar o PDF via `present_asset`.
