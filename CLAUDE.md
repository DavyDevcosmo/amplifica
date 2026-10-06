# Amplifica

## Visão geral

Marketplace multi-vendedor brasileiro de presets, IRs e tone match para pedaleira. O MVP lança só com guitarra, mas o banco é multi-instrumento desde o dia 1 (baixo e violão já estão planejados). Vendedores são sempre pessoa física ou CNPJ (tipo de conta escolhido no onboarding do Stripe, não no cadastro) vendendo criação técnica própria (nunca cover, cifra ou letra de música de terceiro). O produto é 100% digital: sem estoque, sem frete, sem agenda.

O que o Amplifica otimiza: confiança na compra (preview de áudio antes de pagar) e simplicidade para o vendedor (publicar não exige dado bancário — só vender exige). Prefira simplicidade a abstração — este é um projeto solo, desenvolvido em ritmo de fim de semana.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Zustand (estado global no client)
- Prisma + Neon (Postgres, com connection pooling)
- Better Auth (credenciais + verificação por código)
- Zod (validação em toda fronteira de entrada)
- Stripe Connect (split de pagamento, KYC hospedado)
- Cloudflare R2 (arquivos de produto)
- Biome (lint + format, um binário só)
- Vitest + React Testing Library (unitário/integração) + Playwright (E2E)
- pnpm (gerenciador de pacotes)
- Deploy: Vercel

Fora do escopo deste projeto: NestJS, Redis, filas, microsserviços. Não sugerir essas ferramentas a menos que uma dor real de escala apareça.

## Arquitetura
@amplifica\.claude\rules\architecture.md

## Interfaces / UI
 
  - **SEMPRE** use a skill `frontend-design` ao criar/desenhar interfaces (páginas, telas, componentes visuais novos).

## Componentes

  - Prefira componentes do **shadcn/ui**. Antes de criar um novo, verifique via Context7 se já existe um shadcn equivalente; se existir,
instale-o.
  - Extraia componentes/funções reutilizáveis para evitar duplicação.
 

 

## Retorno de Server Action

Todas seguem o mesmo formato:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

##  MCP

- **SEMPRE** use Context7 MCP para buscas de documentação de bibliotecas/frameworks/SDKs.

## Comandos

```bash
pnpm dev              # servidor local
pnpm build            # build de produção
pnpm test             # Vitest
pnpm test:e2e         # Playwright (funcional, contra pnpm dev)
pnpm test:perf        # Playwright de performance (contra build de produção)
pnpm perf:lighthouse  # Lighthouse CI
pnpm perf             # test:perf + perf:lighthouse
pnpm lint             # Biome
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # popular banco local
```

## Validação

- Um hook de `Stop` (`.claude/hooks/verify.mjs`) já roda `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm test` automaticamente antes de qualquer tarefa terminar — se algo falhar, a tarefa não termina até corrigir.
- Em mudança que toca **UI, navegação, banco ou auth**, rode também o agente `test-engineer` (escreve/roda testes e mede performance) e, se for uma mudança de performance, `pnpm perf` — compara contra `e2e/perf/baseline.json` e falha se estourar os budgets em `e2e/perf/budgets.ts`.
- `pnpm perf` exige a branch Neon de teste configurada em `.env.e2e` (ver `.env.e2e.example`).

## Nunca fazer

- Nunca editar uma migration já aplicada — sempre criar uma nova
- Nunca guardar dado bancário/documento de vendedor no banco próprio — isso é só `stripeAccountId`, o resto é do Stripe
- Nunca usar `Float`/`Decimal` para valor monetário
- Nunca criar coluna `Json` sem um schema Zod validando o formato
- Nunca alterar as regras de negócio (comissão, prazo de reembolso, retenção) sem confirmar — ver `.claude/rules/regras-de-negocio.md`

