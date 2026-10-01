---
name: feedback_windows_crlf_biome
description: Rodar biome check no ambiente Windows deste projeto gera ruído de CRLF que não deve virar item do relatório
metadata:
  type: feedback
---

Ao rodar `pnpm exec biome check` neste repo (Windows, sem `.gitattributes`, `core.autocrlf=true`), praticamente todo arquivo novo aparece com erro de formatação — mas o diff mostrado é só `\r\n` vs `\n` (CRLF vs LF), não uma violação de regra de lint real introduzida pela mudança revisada.

**Why:** confirmado em 2026-09-27 revisando a branch `feat/autenticacao` — todos os "erros" de `biome check` nos arquivos novos eram exclusivamente diffs de final de linha, sem nenhuma regra de `lint/*` violada de fato (o `--max-diagnostics` mostrou os mesmos blocos CRLF repetidos). Isso é resultado da configuração local do Git no Windows, não do código do autor.

**How to apply:** ao usar `pnpm exec biome check`/`biome format` como ferramenta de apoio na revisão, ignorar diferenças que sejam puramente de terminador de linha. Só reportar um achado de lint quando o diff mostrar uma mudança de conteúdo real (regra `lint/xxx` disparando em código, não em `\r`). Ver [[project_amplifica_overview]].
