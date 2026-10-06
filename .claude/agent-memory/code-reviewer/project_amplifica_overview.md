---
name: project_amplifica_overview
description: Estrutura, stack e convenções específicas do projeto Amplifica relevantes para revisão de código
metadata:
  type: project
---

Amplifica é um marketplace solo (ritmo fim de semana) de presets/IRs para pedaleira, Next.js App Router + TypeScript + Prisma (Neon) + Better Auth + Stripe Connect. Regras completas em `CLAUDE.md` e `.claude/rules/architecture.md`.

Pontos específicos observados (setembro/2026):
- `prisma/schema/` é multi-arquivo (`auth.prisma`, `order.prisma`, `product.prisma`, `seller.prisma`, `notification.prisma`, `schema.prisma`), não um `schema.prisma` único. Migrations ficam em `prisma/schema/migrations/`.
- `src/proxy.ts` substitui o antigo `middleware.ts` (Next 16) — é só redirect otimista por cookie via `getSessionCookie`, nunca a fonte de autorização real. A autorização de verdade é sempre `requireUser()`/`requireRole()` em `src/lib/auth.ts`, chamados nos layouts de route group.
- Ainda não existe `.claude/rules/regras-de-negocio.md` no repo (só `architecture.md`) — não assumir que ele existe até verificar.
- `.gitattributes` não existe e `core.autocrlf=true` está setado localmente: rodar `pnpm exec biome check` no Windows gera dezenas de falsos positivos de formatação (CRLF vs LF) que não são erros reais de lint introduzidos pela mudança. Ver [[feedback_windows_crlf_biome]].
- Branch `feat/autenticacao` (revisada em 2026-09-27) implementou o fluxo completo de autenticação com Better Auth (signup/login/OTP/reset de senha/Google OAuth), throttle de login progressivo próprio (`loginThrottleService`), limpeza de cadastros não verificados (`pendingSignupService` + cron), upload de avatar via R2 presigned URL, e testes Vitest/Playwright cobrindo o fluxo. Qualidade geral alta, poucos achados de severidade alta.
