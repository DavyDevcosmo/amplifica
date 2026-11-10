---
name: e2e-env-pitfalls
description: Armadilhas ao rodar e2e/perf no Amplifica - servidor dev do usuario na 3000 reutilizado, .env.e2e com credencial Neon invalida, como subir servidor isolado na 3100
metadata:
  type: project
---

Verificado em 2026-10-03 e de novo em 2026-11-09:
- O usuario costuma deixar `next dev` rodando na 3000 (le `.env` = banco de dev `ep-cool-feather`). `playwright.config.ts` tem `reuseExistingServer`, entao `pnpm test:e2e` bateria nele. Checar `netstat -ano | grep :3000` antes. Nao matar o servidor do usuario.
- Contorno que funcionou (2026-11-09): config temporaria no scratchpad que importa `playwright.config.ts`, troca baseURL pra 3100 e sobe `next start -p 3100` com `BETTER_AUTH_URL=http://localhost:3100`; build via launcher node que faz `dotenv.parse('.env.e2e')` e `spawnSync('pnpm exec next build', {env})`. `node -r dotenv/config` quebra o build (NODE_OPTIONS -r nao permitido em worker).
- `.env.e2e` (host agora `ep-old-silence-av026bl7`; antes `ep-falling-pine`) continua dando `password authentication failed for user 'neondb_owner'` nos dois URLs. Nesse arquivo DATABASE_URL e o direto e DIRECT_URL e o pooler (invertido). Specs que gravam e perf nao rodam ate o usuario regenerar a senha da branch `e2e`.
- Specs read-only (storefront, login/tema/idioma/layout, redirects sem sessao) rodam ok com essa credencial quebrada: sem cookie, getSession nao consulta o banco.
- `pnpm test:perf` sobrescreve `.perf-results/latest.json` mesmo em run falho.

**Why:** evitar gravar em banco errado e economizar diagnostico repetido.
**How to apply:** antes de qualquer e2e/perf, checar porta 3000 e rodar `select 1` com as URLs do `.env.e2e`.
