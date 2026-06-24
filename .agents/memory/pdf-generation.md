---
name: PDF Generation Convention
description: Como gerar PDFs de relatório (preferência do usuário: sempre ao concluir tarefa)
---

Preferência permanente do usuário: **sempre gerar um PDF para download ao concluir qualquer tarefa**, resumindo o que foi feito. Salvar em `exports/` e apresentar via present_asset. (também registrado em replit.md User preferences)

Gerador reutilizável: `scripts/src/gerar-pdf.ts` (pdfkit, npm script `gerar-pdf`).
- Recebe 1 arg: caminho do JSON de relatório. O `output` do JSON é resolvido **relativo ao diretório do JSON**.
- **How to apply:** coloque o JSON em `exports/`, com `"output"` contendo APENAS o nome do arquivo .pdf (não repetir `exports/`).
- Rodar com caminho ABSOLUTO do JSON, pois `pnpm --filter @workspace/scripts` muda o cwd para `scripts/`:
  `pnpm --filter @workspace/scripts run gerar-pdf /home/runner/workspace/exports/<arquivo>.json`
- Schema JSON: `{ title, subtitle?, date?, output, sections: [{ heading, body?: string[], bullets?: string[] }] }`.
- pdfkit já está no workspace `scripts` (não-nativo, sem approve-builds). Estilo: header dark (#0B0B0F) + accent dourado (#C9A24B), corpo claro, rodapé paginado — combina com o branding JADE IA.
