---
name: e2e-env-pitfalls
description: Armadilhas ao rodar e2e/perf no Amplifica - servidor dev na 3000 reutilizado, .env.e2e com credencial Neon, BETTER_AUTH_URL vs porta 3100
metadata:
  type: project
---

Verificado em 2026-10-03:
- `playwright.config.ts` usa `reuseExistingServer`: se ja existe `next dev` na porta 3000 (iniciado a mao, le `.env` = banco de dev `ep-frosty-math`, sem `E2E=true`), o e2e funcional bate nele e escreveria no banco de dev / mandaria e-mail pelo transport errado. Antes de rodar specs que gravam, checar `netstat -ano | grep :3000` e o dono do processo. So specs read-only (ex.: GET /login?senha=redefinida) sao seguros nesse cenario.
- `.env.e2e` (host `ep-falling-pine-avyn1lh5`) retornou `28P01 password authentication failed` num `select 1` direto -> e2e e perf nao rodam ate o usuario regenerar a connection string da branch Neon `e2e`.
- Nao fazer `source .env.e2e` no bash: a URL tem `&channel_binding` sem aspas e o `&` quebra a variavel. Usar `DOTENV_CONFIG_PATH=.env.e2e node -r dotenv/config node_modules/next/dist/bin/next start -p 3100`.
- `.env.e2e` tem `BETTER_AUTH_URL=http://localhost:3000`, mas o perf sobe em 3100: possivel problema de origin/trustedOrigins no Better Auth (nao confirmado, o banco falhou antes).
- `pnpm test:perf` sobrescreve `.perf-results/latest.json` mesmo em run falho (mistura metricas antigas e novas).

**Why:** evitar gravar em banco errado e economizar diagnostico repetido.
**How to apply:** rodar a checagem de porta 3000 e um `select 1` com a credencial do `.env.e2e` antes de qualquer e2e/perf.
