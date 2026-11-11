# Área do vendedor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a área do vendedor (`/seller/*`) do canvas v58, desktop e celular, lendo e gravando no banco: virar vendedor, Painel, Vendas, Meus produtos, Novo/editar produto em 5 etapas (rascunho, envio para análise, upload ao R2), Carteira, Perfil e Recebimentos (só status).

**Architecture:** Rotas em `src/app/(seller)/seller/*` só compõem; leituras em `src/server/queries/`, regras puras e transações em `src/server/services/`, escritas em `src/actions/` (Zod → service → `ActionResult`). Um layout com guard decide sessão + `SellerProfile`. Responsivo por breakpoint do Tailwind: `lg` e acima mostra a barra lateral; abaixo de `lg`, cabeçalho noite com logo + "Amplifica" e menu hambúrguer. Toda conta de dinheiro e de mês sai de funções puras testadas.

**Tech Stack:** Next.js 16 (App Router, Server Components), TypeScript, Tailwind v4, next-intl, shadcn (base-nova, Base UI), Prisma 7 + Neon, Zod 4, Cloudflare R2 (S3 SDK), Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-area-do-vendedor-design.md` (atualizado em 2026-11-10 para o canvas v58). Referência visual: canvas https://claude.ai/artifact/KETYDZu5RiECjFfEdybHqC, arquivos `project/*.dc.html` (cópia local em `C:\Users\davyc\AppData\Local\Temp\claude\f24cbbbbee68c0e7\14acc15c-f1f4-4ef5-ae81-06a6de112d5b\scratchpad\impl\project\`). Quando a cópia local sumir, leia o canvas com a ferramenta Artifact (`action: "read"`).

## Global Constraints

- Regras de negócio só de `SELLER_RULES` (`src/components/seller/sellerEarnings.ts`): comissão 1500 bps, retenção 30 dias, reembolso 7 dias, Fundador 10 vendas / 90 dias, mínimo 1000 centavos, taxa 399 bps + 39 centavos. Não alterar valores.
- Dinheiro sempre em centavos `Int`. Nunca `Float`/`Decimal`.
- Nunca editar migration aplicada; criar uma nova (`pnpm db:migrate --name seller_area`).
- Nunca guardar dado bancário/documento; do Stripe só `stripeAccountId`/`stripeAccountStatus`.
- Arquivo `DELIVERABLE` nunca em bucket público nem com URL pública.
- Mês e dia sempre no fuso `America/Sao_Paulo`.
- Todo texto de interface em `src/messages/pt-BR/ui.json` e `src/messages/en/ui.json`, namespace `seller` (o teste `messages.test.ts` exige as mesmas chaves nos dois). Copiar o texto do canvas literalmente para pt-BR.
- Componentes: shadcn primeiro (`pnpm dlx shadcn@latest add <nome>`); conferir via Context7 antes de criar um componente que talvez exista. A instalar quando a tarefa pedir: `textarea`, `native-select`, `table`.
- Visual: tokens já existentes em `globals.css` (`bg-noite`, `bg-creme`, `text-azul`, `bg-azul`, `hover:bg-azul-forte`, `text-azul-claro`, `rounded-card`, `rounded-tile`, `font-display`, `type-eyebrow`, `type-label`). Cor de texto secundário `#516d8d` = token `ardosia`. Não criar paleta nova.
- Alvo de toque mínimo 44px; foco visível (`focus-visible:ring-2 ring-azul`); respeitar `prefers-reduced-motion`.
- Pastas camelCase, arquivos camelCase com sufixo de papel, componentes React em PascalCase.
- Rodar `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm test` ao fim de cada tarefa.
- **Não rodar `git commit`.** O usuário commita. Ao fim de cada tarefa, anote no relatório o commit no formato do CLAUDE.md (título e descrição em português, depois o comando `git commit` em inglês).
- Não atualizar `e2e/perf/baseline.json`.

## Review Focus

1. Venda às 23h30 de 30/11 em Brasília (02h30 UTC de 1/12) conta em novembro, no painel, na lista de vendas e no gráfico — teste na Tarefa 2.
2. Vendedor A abrindo `/seller/products/<id do B>/edit` ou chamando qualquer action com id de produto/arquivo de outro vendedor: `notFound()` na página, `fail` na action, sem vazar dado — testes na Tarefa 7 e e2e na Tarefa 14.
3. Preço digitado como `1.234,50`, `10`, `9,99`, `,5`, vazio ou `abc`: conversão correta e envio bloqueado abaixo de R$ 10 (exceto gratuito) — teste na Tarefa 2.
4. Confirmar upload com `key` fora do prefixo do produto, tipo não permitido ou tamanho acima do limite: rejeitado e nada gravado — teste na Tarefa 8.
5. Editar produto em análise, enviar duas vezes ou editar produto publicado: em análise fica só leitura, segundo envio falha, edição de publicado cria revisão nova e a versão no ar não muda — testes na Tarefa 7.

---

## File Structure

```
prisma/schema/product.prisma           (mod) ProductType.OTHER, CaptureKind, campos novos
prisma/schema/seller.prisma            (mod) city, devices, redes sociais

src/lib/utils.ts                       (mod) slugify()
src/lib/env.ts                         (mod) R2_PRIVATE_BUCKET, FOUNDER_PROGRAM_STARTS_AT
src/lib/r2.ts                          (mod) bucket como parâmetro, headObject

src/components/seller/sellerEarnings.ts (mod) estimateProcessingCents, saleBreakdown, parseBrlToCents
src/lib/brasiliaTime.ts                (new) mês/dia em America/Sao_Paulo

src/server/queries/sellerQueries.ts    (new) getCurrentSeller, getSellerNavSummary
src/server/queries/salesQueries.ts     (new) itens do vendedor por intervalo
src/server/queries/productQueries.ts   (new) lista e rascunho do vendedor
src/server/services/salesReport.ts     (new) PURO: resumo do mês, série diária, por produto, status do item
src/server/services/walletService.ts   (new) PURO: saldos, liberações, extrato
src/server/services/productService.ts  (new) rascunho, revisão, envio, status da lista, checklist
src/server/services/productFileService.ts (new) validação e registro de upload
src/server/services/sellerService.ts   (new) virar vendedor, salvar perfil

src/schemas/productSchema.ts           (new) draft e submit
src/schemas/sellerSchema.ts            (new) onboarding e perfil

src/actions/sellerActions.ts           (new)
src/actions/productActions.ts          (new)

src/app/(seller)/seller/layout.tsx              guard + shell
src/app/(seller)/seller/page.tsx                Painel
src/app/(seller)/seller/sales/page.tsx          Vendas
src/app/(seller)/seller/products/page.tsx       Meus produtos
src/app/(seller)/seller/products/new/page.tsx
src/app/(seller)/seller/products/[id]/edit/page.tsx
src/app/(seller)/seller/wallet/page.tsx         Carteira
src/app/(seller)/seller/profile/page.tsx        Perfil
src/app/(seller)/seller/payouts/page.tsx        Recebimentos (status)
src/app/(customer)/becomeSeller/page.tsx        Virar vendedor (URL /becomeSeller)

src/components/seller/shell/   SellerSidebar, SellerMobileHeader, sellerNav.ts, SellerPageHeader
src/components/seller/dashboard/ KpiGrid, FounderCard, MonthBars, RecentSales, StartChecklist, ReceivingBanner
src/components/seller/sales/   MonthPicker, SalesChart, SalesTable, ProductFilter
src/components/seller/products/ ProductList, ProductRow, StatusFilter
src/components/seller/productForm/ ProductWizard, WizardStepper, WizardNavBar, StepInfo, StepClassification,
                                   StepFiles, StepPrice, StepReview, StorePreviewCard, SubmitChecklist, FileUploader
src/components/seller/wallet/  BalanceCards, Releases, Statement
src/components/seller/profile/ SellerProfileForm, CreatorPreview
src/components/seller/StatusBadge.tsx

e2e/seller.spec.ts
```

Rota de onboarding: a área `/seller/*` exige `SellerProfile`, então o onboarding fica fora dela, em `src/app/(customer)/becomeSeller/page.tsx` (pasta camelCase, regra do projeto). Adicione `/becomeSeller` a `PROTECTED_PREFIXES` e ao `matcher` em `src/proxy.ts`.

---

### Task 1: Schema e seed

**Files:**
- Modify: `prisma/schema/product.prisma`, `prisma/schema/seller.prisma`
- Create: migration via `pnpm db:migrate --name seller_area`

**Interfaces:**
- Produces (Prisma):
  - `enum ProductType` ganha `OTHER`.
  - `enum CaptureKind { AMP AMP_CAB PEDAL OTHER }`.
  - `Product`: `kinds ProductType[]`, `shortDescription String @default("")`.
  - `ProductRevision`: `shortDescription String @default("")`, `includes String[]`, `kinds ProductType[]`, `kindOther String?`, `styles String[]`, `styleOther String?`, `capturedAmp String?`, `captureKind CaptureKind?`, `captureKindOther String?`, `youtubeUrl String?`, `priceCents Int?`. (`description` da revisão = "Sobre o pack".)
  - `SellerProfile`: `city String?`, `devices String[]`, `instagram String?`, `youtube String?`, `tiktok String?`, `spotifyUrl String?`.
  - Index novo: `@@index([kinds], type: Gin)` em `Product`.

- [ ] **Step 1:** Editar os dois `.prisma` com os campos acima. `productType` continua obrigatório: o service grava `kinds[0]`.
- [ ] **Step 2:** `pnpm db:migrate --name seller_area` contra a branch de dev. Esperado: migration criada em `prisma/schema/migrations/*_seller_area/` e `prisma generate` sem erro.
- [ ] **Step 3:** **Não popular o banco** (decisão do usuário: as telas não precisam ter dados; cada uma mostra o seu estado vazio). Mexa no seed só se ele deixar de compilar por causa do schema novo. Todos os campos novos são opcionais, listas ou têm default, então o esperado é não precisar mexer.
- [ ] **Step 4:** `pnpm lint && pnpm exec tsc --noEmit && pnpm test`. Esperado: tudo passa.
- [ ] **Step 5:** Anotar commit: `feat(db): add seller area fields to product, revision and seller profile`.

---

### Task 2: Funções puras de dinheiro e de mês

**Files:**
- Modify: `src/components/seller/sellerEarnings.ts`, `src/components/seller/sellerEarnings.test.ts`, `src/lib/utils.ts`, `src/lib/utils.test.ts`
- Create: `src/lib/brasiliaTime.ts`, `src/lib/brasiliaTime.test.ts`

**Interfaces:**
- Produces:
  - `estimateProcessingCents(priceCents: number): number` — 0 se `priceCents === 0`, senão `round(price*399/10000) + 39`.
  - `type SaleBreakdown = { grossCents; commissionCents; processingCents; netCents; exempt: boolean }`
  - `saleBreakdown(item: { priceCents: number; platformFeeCents: number }): SaleBreakdown` — comissão = `platformFeeCents` gravado no pedido; `exempt = priceCents > 0 && platformFeeCents === 0`; `net = max(0, gross − commission − processing)`. A taxa é **estimada** até o checkout gravar a real (decisão minha, ver handoff).
  - `parseBrlToCents(input: string): number | null`
  - `slugify(text: string): string` — minúsculas, sem acento, `[a-z0-9-]`, sem hífens repetidos/nas pontas.
  - `brasiliaTime.ts`: `type MonthKey = \`${number}-${string}\`` ("2026-11"); `monthKeyOf(date: Date): MonthKey`; `currentMonthKey(now?: Date): MonthKey`; `parseMonthKey(raw: string | undefined, now?: Date): MonthKey` (inválido ou futuro → mês atual); `monthBounds(key: MonthKey): { start: Date; end: Date }` (instantes UTC, `end` exclusivo); `shiftMonth(key, delta: number): MonthKey`; `monthsBetween(from: MonthKey, to: MonthKey): MonthKey[]` (inclusivo, crescente); `dayOfMonth(date: Date): number`; `daysInMonth(key): number`; `brasiliaDayKey(date: Date): string` ("2026-12-07").

- [ ] **Step 1: Testes que falham**

```ts
// sellerEarnings.test.ts (acrescentar)
test('estimateProcessingCents', () => {
  expect(estimateProcessingCents(6792)).toBe(310) // 271 + 39
  expect(estimateProcessingCents(0)).toBe(0)
})
test('saleBreakdown com comissão e isenta', () => {
  expect(saleBreakdown({ priceCents: 6792, platformFeeCents: 1019 }))
    .toEqual({ grossCents: 6792, commissionCents: 1019, processingCents: 310, netCents: 5463, exempt: false })
  expect(saleBreakdown({ priceCents: 6792, platformFeeCents: 0 }).exempt).toBe(true)
  expect(saleBreakdown({ priceCents: 0, platformFeeCents: 0 }).exempt).toBe(false)
})
test.each([
  ['67,92', 6792], ['1.234,50', 123450], ['10', 1000], ['9,99', 999], [',5', 50], [' 12,3 ', 1230],
  ['', null], ['abc', null], ['12,345', null], ['-5', null],
])('parseBrlToCents(%s)', (input, cents) => expect(parseBrlToCents(input)).toBe(cents))

// brasiliaTime.test.ts
test('23h30 de 30/11 em Brasília é novembro', () => {
  expect(monthKeyOf(new Date('2026-12-01T02:30:00Z'))).toBe('2026-11')
  expect(dayOfMonth(new Date('2026-12-01T02:30:00Z'))).toBe(30)
})
test('monthBounds de novembro', () => {
  expect(monthBounds('2026-11')).toEqual({ start: new Date('2026-11-01T03:00:00Z'), end: new Date('2026-12-01T03:00:00Z') })
})
test('parseMonthKey cai no mês atual quando inválido ou futuro', () => {
  const now = new Date('2026-11-10T15:00:00Z')
  expect(parseMonthKey('2026-10', now)).toBe('2026-10')
  expect(parseMonthKey('2030-01', now)).toBe('2026-11')
  expect(parseMonthKey('2026-13', now)).toBe('2026-11')
  expect(parseMonthKey(undefined, now)).toBe('2026-11')
})
test('shiftMonth e monthsBetween atravessam o ano', () => {
  expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  expect(monthsBetween('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
})
// utils.test.ts
test('slugify', () => expect(slugify('Plexi 68 — Helix  Ação!')).toBe('plexi-68-helix-acao'))
```

- [ ] **Step 2:** `pnpm test src/lib src/components/seller`. Esperado: FAIL (funções não existem).
- [ ] **Step 3:** Implementar. Brasília não tem horário de verão desde 2019: usar `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year, month, day })` para extrair partes, e `monthBounds` via offset fixo −03:00 (`new Date(\`${key}-01T00:00:00-03:00\`)`). `parseBrlToCents`: aceitar `^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d*(,\d{1,2})?$` depois de `trim`, rejeitar vazio.
- [ ] **Step 4:** `pnpm test src/lib src/components/seller`. Esperado: PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add money breakdown and Brasília month helpers`.

---

### Task 3: Guard, shell responsivo e virar vendedor

**Files:**
- Create: `src/server/queries/sellerQueries.ts`, `src/server/services/sellerService.ts`, `src/schemas/sellerSchema.ts` (+ `.test.ts`), `src/actions/sellerActions.ts`, `src/app/(seller)/seller/layout.tsx`, `src/app/(customer)/becomeSeller/page.tsx`, `src/components/seller/shell/{SellerSidebar,SellerMobileHeader,SellerPageHeader}.tsx`, `src/components/seller/shell/sellerNav.ts`, `src/components/seller/shell/SellerMobileHeader.test.tsx`, `src/components/seller/BecomeSellerForm.tsx`
- Modify: `src/proxy.ts`, `src/messages/{pt-BR,en}/ui.json`

**Interfaces:**
- Produces:
  - `getCurrentSeller(): Promise<SellerContext | null>` (React `cache`), `type SellerContext = { user: SessionUser; seller: SellerProfileModel }`.
  - `requireSeller(): Promise<SellerContext>` em `sellerQueries.ts`: sem sessão → `requireUser('/seller')`; sem perfil → `redirect('/becomeSeller')`; `status === 'SUSPENDED'` → `redirect('/')`.
  - `getSellerNavSummary(sellerId: string): Promise<{ heldCents: number }>` (badge "R$ X retido" da Carteira; usa `walletService` da Tarefa 4 — até lá, a soma direta de `sellerAmountCents` dos itens retidos; troque na Tarefa 4).
  - `becomeSellerSchema = z.object({ displayName: z.string().trim().min(2,'displayNameTooShort').max(40,'displayNameTooLong'), bio: z.string().trim().max(400,'bioTooLong').optional() })`
  - `becomeSeller(userId: string, input: BecomeSellerInput): Promise<SellerProfileModel>` — `slug = slugify(displayName) + '-' + 6 chars aleatórios`, `isFounder: false` (decisão minha até a pergunta 3 do spec ser respondida), `avatarKey: null` (foto = `user.image`). Se já existe perfil, devolve o existente.
  - `becomeSellerAction(input): Promise<ActionResult<null>>` → `redirect('/seller')` no sucesso.
  - `SELLER_NAV: { id: 'dashboard'|'sales'|'products'|'wallet'|'profile'|'payouts'; href: string; icon: LucideIcon; labelKey: string }[]` — hrefs `/seller`, `/seller/sales`, `/seller/products`, `/seller/wallet`, `/seller/profile`, `/seller/payouts`; ícones lucide `LayoutDashboard`, `TrendingUp`, `Package`, `Wallet`, `UserRound`, `Landmark`.
  - `<SellerPageHeader eyebrow title subtitle? action? />`.

Layout (`layout.tsx`): `const { user, seller } = await requireSeller()`; `<div className="flex min-h-dvh flex-col bg-creme lg:flex-row">` com `<SellerSidebar className="hidden lg:flex" …/>` (264px, `bg-noite`, sticky, altura da tela) e `<SellerMobileHeader className="lg:hidden" …/>` (sticky top-0 z-20). `<main className="min-w-0 flex-1 px-4 pt-8 pb-14 md:px-8 xl:px-10">`. Nada de `StoreHeader`/`SiteFooter` nessa área.

Barra lateral (canvas `Sidebar.dc.html`): logo + AMPLIFICA; cartão do vendedor (avatar com iniciais ou `user.image`, nome, "Vendedor fundador" com o selo `FounderSeal` se `isFounder`) que leva a `/seller/profile`; botão pílula azul "Novo produto" → `/seller/products/new`; lista `SELLER_NAV` com item ativo `aria-current="page"` e fundo `azul/28%`; badge do retido na Carteira; rodapé "Voltar para a loja" → `/`. Ativo: client component pequeno com `usePathname()` (`/seller` exato para o Painel, prefixo para os demais).

Cabeçalho do celular (canvas `MobileTop.dc.html`): altura 64px, `bg-noite`; à esquerda link logo + "Amplifica" para `/seller`; à direita botão 44px hambúrguer (`aria-expanded`, `aria-controls="seller-menu"`, rótulo "Abrir menu"/"Fechar menu", ícone `Menu`/`X`). Aberto, mostra `<nav id="seller-menu">` empurrando o conteúdo (não sobreposto) com os itens de `SELLER_NAV` (rótulos do celular: "Meus produtos", "Perfil de vendedor") e "Voltar para a loja" separado por linha. Fecha ao trocar de rota e com `Escape`. Sem botão "+" e sem título.

- [ ] **Step 1: Testes que falham**

```tsx
// SellerMobileHeader.test.tsx
test('hambúrguer abre e fecha o menu do vendedor', async () => {
  renderWithIntl(<SellerMobileHeader />)
  const button = screen.getByRole('button', { name: 'Abrir menu' })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('navigation', { name: 'Área do vendedor' })).toBeNull()
  await userEvent.click(button)
  expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
  const nav = screen.getByRole('navigation', { name: 'Área do vendedor' })
  expect(within(nav).getByRole('link', { name: 'Meus produtos' })).toHaveAttribute('href', '/seller/products')
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('navigation', { name: 'Área do vendedor' })).toBeNull()
})
// sellerSchema.test.ts
test('becomeSellerSchema', () => {
  expect(becomeSellerSchema.safeParse({ displayName: ' T ' }).success).toBe(false)
  expect(becomeSellerSchema.safeParse({ displayName: 'Tiago Ramos' }).success).toBe(true)
  expect(becomeSellerSchema.safeParse({ displayName: 'x'.repeat(41) }).success).toBe(false)
})
```
Mockar `next/navigation` (`usePathname` → `'/seller'`) no teste.

- [ ] **Step 2:** `pnpm test src/components/seller/shell src/schemas`. Esperado: FAIL.
- [ ] **Step 3:** Implementar os arquivos acima. Página `/becomeSeller`: usa o layout `(customer)` (com cabeçalho da loja); título "Comece a vender", campos nome de vendedor e "Sobre você", texto "Publicar não pede dados bancários. Você conecta o recebimento só quando quiser vender."; se o usuário já é vendedor, `redirect('/seller')`.
- [ ] **Step 4:** `pnpm test`. Esperado: PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add seller guard, responsive shell and onboarding`.

---

### Task 4: Relatório de vendas e carteira (puros) + queries

**Files:**
- Create: `src/server/services/salesReport.ts` (+ `.test.ts`), `src/server/services/walletService.ts` (+ `.test.ts`), `src/server/queries/salesQueries.ts`
- Modify: `src/server/queries/sellerQueries.ts` (badge passa a usar `walletSummary`)

**Interfaces:**
- Consumes: `saleBreakdown`, `monthKeyOf`, `dayOfMonth`, `daysInMonth`, `brasiliaDayKey` (Tarefa 2).
- Produces:
  - `type SaleItem = { id: string; orderId: string; productId: string; productTitle: string; priceCents: number; platformFeeCents: number; status: 'PAID' | 'REFUNDED'; createdAt: Date; availableAt: Date; transferredAt: Date | null; refund: { amountCents: number; status: 'PENDING'|'SUCCEEDED'|'FAILED'; processedAt: Date | null } | null }`
  - `type ItemState = { kind: 'held'; until: Date } | { kind: 'available' } | { kind: 'refunded' }`; `itemState(item: SaleItem, now: Date): ItemState`.
  - `orderLabel(orderId: string): string` — `'#' + orderId.slice(-6).toUpperCase()` (não mostra comprador).
  - `type MonthSummary = { salesCount; grossCents; commissionCents; processingCents; refundsCents; refundsCount; netCents }` — vendas válidas = `status === 'PAID'`; reembolsos = itens `REFUNDED` do mês (soma `priceCents`).
  - `summarizeMonth(items: SaleItem[]): MonthSummary`
  - `type DayPoint = { day: number; future: boolean; byProduct: { productId: string; count: number; netCents: number }[] }`; `dailySeries(items: SaleItem[], month: MonthKey, now: Date): DayPoint[]` (um ponto por dia do mês; `future` = depois de hoje em Brasília).
  - `type ProductTotal = { productId; title; count; netCents }`; `totalsByProduct(items): ProductTotal[]` ordenado por `netCents` desc.
  - `type WalletSummary = { availableCents; heldCents; heldCount; nextReleaseAt: Date | null; receivedCents; transferredCents }` — por item `PAID`: `net` de `saleBreakdown`; disponível = `available` e `transferredAt === null`; retido = `held`; recebido = todos `PAID`; transferido = `transferredAt !== null`.
  - `walletSummary(items: SaleItem[], now: Date): WalletSummary`
  - `type Release = { dayKey: string; date: Date; amountCents: number; count: number }`; `upcomingReleases(items, now, limit = 4): Release[]` agrupado por `brasiliaDayKey(availableAt)`, crescente.
  - `type StatementKind = 'sale' | 'refund' | 'transfer'`; `type StatementRow = { id; date: Date; kind: StatementKind; title: string; grossCents: number; commissionCents: number | null; processingCents: number | null; netCents: number; state: 'held' | 'available' | 'refunded' | 'transferred'; exempt: boolean }`; `buildStatement(items, now): StatementRow[]` desc por data: uma linha `sale` por item; uma linha `refund` por reembolso `SUCCEEDED` (valores negativos, data `processedAt`); uma linha `transfer` por dia de `transferredAt` somando os nets (negativo, título "Transferência para sua conta Stripe").
  - `salesQueries.ts`: `getSellerItems(sellerId: string, range?: { start: Date; end: Date }): Promise<SaleItem[]>` (só `order.status` em `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED`); `getFirstSaleDate(sellerId): Promise<Date | null>`; `getRecentItems(sellerId, take = 5): Promise<SaleItem[]>`.

- [ ] **Step 1: Testes que falham** — fixture `item(overrides)` com padrão `priceCents 6792, platformFeeCents 1019, status 'PAID'`, `now = 2026-11-10T15:00Z`.

```ts
test('itemState: retido, disponível e reembolsado', () => {
  expect(itemState(item({ availableAt: new Date('2026-12-09T12:00Z') }), now)).toEqual({ kind: 'held', until: new Date('2026-12-09T12:00Z') })
  expect(itemState(item({ availableAt: new Date('2026-11-01T12:00Z') }), now)).toEqual({ kind: 'available' })
  expect(itemState(item({ status: 'REFUNDED' }), now)).toEqual({ kind: 'refunded' })
})
test('summarizeMonth separa reembolsos do líquido', () => {
  const s = summarizeMonth([item(), item({ platformFeeCents: 0 }), item({ status: 'REFUNDED', priceCents: 3490 })])
  expect(s).toMatchObject({ salesCount: 2, grossCents: 13584, commissionCents: 1019, refundsCents: 3490, refundsCount: 1, netCents: 5463 + 6482 })
})
test('dailySeries marca dias futuros e agrupa por produto', () => {
  const points = dailySeries([item({ createdAt: new Date('2026-11-05T13:00Z'), productId: 'a' }), item({ createdAt: new Date('2026-11-05T14:00Z'), productId: 'a' })], '2026-11', now)
  expect(points).toHaveLength(30)
  expect(points[4].byProduct).toEqual([{ productId: 'a', count: 2, netCents: 2 * 5463 }])
  expect(points[10].future).toBe(true)
  expect(points[9].future).toBe(false)
})
test('walletSummary', () => {
  const w = walletSummary([
    item({ availableAt: new Date('2026-12-09T12:00Z') }),
    item({ availableAt: new Date('2026-11-01T12:00Z') }),
    item({ availableAt: new Date('2026-10-01T12:00Z'), transferredAt: new Date('2026-10-02T12:00Z') }),
    item({ status: 'REFUNDED' }),
  ], now)
  expect(w).toEqual({ availableCents: 5463, heldCents: 5463, heldCount: 1, nextReleaseAt: new Date('2026-12-09T12:00Z'), receivedCents: 3 * 5463, transferredCents: 5463 })
})
test('upcomingReleases agrupa por dia de Brasília e limita', () => { /* 3 itens em 2 dias → 2 linhas, count 2 e 1 */ })
test('buildStatement gera venda, reembolso e transferência', () => { /* kinds ['refund','sale','sale','transfer'] na ordem de data desc; refund.netCents negativo */ })
```

- [ ] **Step 2:** `pnpm test src/server/services/salesReport src/server/services/walletService`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Os dois services começam com `import 'server-only'` (o Vitest já troca por stub). Queries com `select` explícito, nunca `include` inteiro.
- [ ] **Step 4:** `pnpm test`. Esperado: PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add sales report and wallet calculations`.

---

### Task 5: Painel (`/seller`)

**Files:**
- Create: `src/app/(seller)/seller/page.tsx`, `src/components/seller/dashboard/{KpiGrid,FounderCard,MonthBars,RecentSales,StartChecklist,ReceivingBanner}.tsx`, `src/components/seller/StatusBadge.tsx`, `src/components/seller/dashboard/StartChecklist.test.tsx`
- Modify: `src/lib/env.ts` (`FOUNDER_PROGRAM_STARTS_AT: z.iso.datetime().optional()`), messages

**Interfaces:**
- Consumes: `requireSeller`, `getSellerItems`, `getRecentItems`, `summarizeMonth`, `dailySeries`, `walletSummary`, `itemState`, `currentMonthKey`, `monthBounds`, `shiftMonth`.
- Produces:
  - `<KpiGrid items={{ label; value; note; tone?: 'default'|'held'|'available'|'danger' }[]} />` — `grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4`, cartão `p-4 lg:p-5`, valor `text-xl lg:text-[1.625rem]` `font-display tabular-nums`. Reusado em Vendas.
  - `<StatusBadge state={ItemState | 'transferred'} />` — "Retida até 9 dez" (azul), "Disponível" (verde `#2f6b3a`), "Reembolsada" (vermelho `#a52a17`), "Transferida". Reusado em Vendas e Carteira.
  - `founderStatus(seller, now, startsAt?: Date): { used: number; total: 10; remainingSales: number; daysLeft: number | null }` em `src/components/seller/dashboard/founderStatus.ts` (puro; `daysLeft = null` sem `FOUNDER_PROGRAM_STARTS_AT`).

Conteúdo (canvas `Main.dc.html`): cabeçalho "Painel" / "Olá, {primeiro nome}" / "Resumo de {mês} até hoje." e botão "Novo produto". `ReceivingBanner` (faixa noite com brilho azul) quando `stripeAccountStatus !== 'VERIFIED'`, botão "Conectar recebimento" → `/seller/payouts`. Sem produto nenhum: `StartChecklist` (3 passos; perfil feito quando `bio` preenchida; produto feito quando há produto `PUBLISHED`; recebimento feito quando `VERIFIED`; texto do canvas). Com produto: KPIs (Vendas no mês com "N a mais/menos que {mês anterior}", Você recebeu (líquido) do mês, Saldo retido, Disponível para saque), linha com `FounderCard` (só se `isFounder`; "7 de 10 vendas sem comissão usadas", barra, "Faltam 3 vendas isentas e 63 dias de programa…"; sem data, omitir a parte dos dias) e `MonthBars` (barras por dia até hoje, último dia azul, vazios cinza, `role="img"` com `aria-label` do pico), e `RecentSales` (5 últimas; tabela `min-w-[680px]` com rolagem horizontal; link "Ver todas as vendas" → `/seller/sales`).

- [ ] **Step 1: Teste que falha**

```tsx
test('checklist marca o perfil feito e destaca o próximo passo', () => {
  renderWithIntl(<StartChecklist profileDone productDone={false} receivingDone={false} />)
  const items = screen.getAllByRole('listitem')
  expect(within(items[0]).getByText('Feito')).toBeInTheDocument()
  expect(within(items[1]).getByRole('link', { name: 'Novo produto' })).toHaveAttribute('href', '/seller/products/new')
})
test('founderStatus', () => {
  expect(founderStatus({ isFounder: true, founderWaivedSalesCount: 7 }, new Date('2026-11-10T12:00Z'), new Date('2026-10-14T12:00Z')))
    .toEqual({ used: 7, total: 10, remainingSales: 3, daysLeft: 63 })
  expect(founderStatus({ isFounder: true, founderWaivedSalesCount: 12 }, new Date(), undefined)).toMatchObject({ used: 10, remainingSales: 0, daysLeft: null })
})
```

- [ ] **Step 2:** rodar; FAIL. **Step 3:** implementar. **Step 4:** `pnpm test`; PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add seller dashboard`.

---

### Task 6: Vendas (`/seller/sales`)

**Files:**
- Create: `src/app/(seller)/seller/sales/page.tsx`, `src/components/seller/sales/{MonthPicker,SalesChart,SalesTable,ProductFilter}.tsx`, `src/components/seller/sales/MonthPicker.test.tsx`, `src/components/seller/sales/SalesChart.test.tsx`
- Install: `pnpm dlx shadcn@latest add native-select table`

**Interfaces:**
- Consumes: `parseMonthKey`, `monthBounds`, `monthsBetween`, `shiftMonth`, `getSellerItems`, `getFirstSaleDate`, `summarizeMonth`, `dailySeries`, `totalsByProduct`, `itemState`, `orderLabel`, `saleBreakdown`, `KpiGrid`, `StatusBadge`.
- Produces:
  - Página lê `searchParams: Promise<{ mes?: string; produto?: string }>`; `month = parseMonthKey(mes)`; meses = `monthsBetween(monthKeyOf(firstSale) ?? atual, atual)`; `produto` desconhecido → todos.
  - `<MonthPicker month={MonthKey} months={MonthKey[]} current={MonthKey} />` (client): setas anterior/próximo (desabilitadas nas pontas, 44px), `NativeSelect` com os meses ("Novembro de 2026", mais recente primeiro), botão "Mês atual" quando não está no atual. Navega com `router.push('?mes=…')` preservando nada além do mês (produto volta a todos).
  - `<SalesChart days={DayPoint[]} products={{ id; title; color }[]} monthLabel />` (client): alternância "Quantidade" / "Você recebe" (`aria-pressed`), barras empilhadas por produto, eixo Y com 5 marcas, marcas do X no dia 1 e múltiplos de 5, cada dia é `<button>` com `aria-label` ("Dia 5: 2 vendas" / "Dia 12: ainda não chegou", desabilitado no futuro); `role="status"` mostra o dia focado (padrão: o de maior valor) com a soma por produto; legenda "Totais por produto no mês". Cores na ordem `#2563eb`, `#1c3352`, `#80a0c5`, `#c6ab95`; do 5º produto em diante, `#516d8d`.
  - `<SalesTable rows />`: colunas Data (dia + hora), Pedido, Produto, Valor, Comissão ("Isenta" se `exempt`), Taxa, Você recebe (negativo em vermelho se reembolsada), Situação. Contêiner `tabIndex={0} role="region" aria-label="Tabela de vendas do mês"`, `overflow-x-auto`; abaixo de `md`: `max-h-[318px] overflow-y-auto` com `thead` sticky (5 linhas visíveis).
  - `<ProductFilter options value />` (client): `NativeSelect` "Produto" → `?mes=…&produto=…`.

Conteúdo (canvas `Vendas.dc.html`): título = nome do mês ("Novembro de 2026"), KPIs Vendas / Valor bruto / Reembolsos / Você recebe (mesma grade 2×2 no celular), gráfico, lista "Todas as vendas do mês (N)". Mês sem vendas: cartão "Nenhuma venda neste mês" / "Use as setas para ver outro mês." com o seletor ativo.

- [ ] **Step 1: Testes que falham**

```tsx
test('MonthPicker desabilita próximo no mês atual e mostra Mês atual fora dele', async () => {
  const push = vi.fn(); mockRouter({ push })
  const { rerender } = renderWithIntl(<MonthPicker month="2026-11" months={['2026-10','2026-11']} current="2026-11" />)
  expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Mês atual' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
  expect(push).toHaveBeenCalledWith('?mes=2026-10')
})
test('SalesChart troca métrica e anuncia o dia focado', async () => {
  renderWithIntl(<SalesChart days={fixtureDays} products={[{ id: 'a', title: 'Plexi 68 — Helix', color: '#2563eb' }]} monthLabel="novembro" />)
  await userEvent.click(screen.getByRole('button', { name: 'Dia 5: 2 vendas' }))
  expect(screen.getByRole('status')).toHaveTextContent('Dia 5 de novembro')
  await userEvent.click(screen.getByRole('button', { name: 'Você recebe' }))
  expect(screen.getByRole('button', { name: /Dia 5: R\$\s?109,26/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Dia 12: ainda não chegou' })).toBeDisabled()
})
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `pnpm test`; PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add monthly sales page`.

---

### Task 7: Produto — schemas, service e actions (sem UI)

**Files:**
- Create: `src/schemas/productSchema.ts` (+ `.test.ts`), `src/server/services/productService.ts` (+ `.test.ts` dos puros), `src/server/queries/productQueries.ts`, `src/actions/productActions.ts`

**Interfaces:**
- Consumes: `slugify`, `SELLER_RULES.minPriceCents`, `requireSeller`/`getCurrentSeller`.
- Produces:
  - `STYLE_OPTIONS = ['Rock clássico','Hard rock','Metal moderno','Blues','Funk / Fusion','Worship','Pop','Jazz','Indie','Ambient'] as const` (+ "Outro" na UI via `styleOther`).
  - `productDraftSchema` (tudo opcional para rascunho): `{ kinds: z.array(z.enum(['PRESET','IR','CAPTURE','OTHER'])).max(4).default([]), kindOther: z.string().trim().max(60).optional(), title: z.string().trim().max(80).default(''), shortDescription: z.string().trim().max(120).default(''), about: z.string().trim().max(4000).default(''), includes: z.array(z.string().trim().min(1).max(120)).max(20).default([]), styles: z.array(z.enum(STYLE_OPTIONS)).max(3).default([]), styleOther: z.string().trim().max(40).optional(), capturedAmp: z.string().trim().max(80).optional(), captureKind: z.enum(['AMP','AMP_CAB','PEDAL','OTHER']).optional(), captureKindOther: z.string().trim().max(60).optional(), youtubeUrl: z.url().refine(isYoutubeUrl,'youtubeInvalid').optional().or(z.literal('')), priceCents: z.int().min(0).max(100_000_00).default(0), free: z.boolean().default(false) }` com refine: `styles.length + (styleOther ? 1 : 0) <= 3`.
  - `productSubmitSchema = productDraftSchema.superRefine(...)`: `kinds.length >= 1`, `kindOther` obrigatório se `OTHER`, `title.length >= 3`, `shortDescription.length >= 10`, `free || priceCents >= SELLER_RULES.minPriceCents`.
  - `type ChecklistItem = { id: 'basics' | 'files' | 'price'; ok: boolean }`; `submitChecklist(draft: ProductDraftInput, deliverableCount: number): ChecklistItem[]` — rótulos na UI: "Tipo, nome e descrição", "Arquivos do pack enviados", "Preço a partir de R$ 10,00" / "Produto gratuito".
  - `type ListStatus = 'published' | 'review' | 'draft' | 'rejected'`; `listStatusOf(product: { status: ProductStatus }, latest: { status: RevisionStatus } | null): ListStatus | null` — latest `PENDING_REVIEW` → `review`; latest `REJECTED` → `rejected`; produto `PUBLISHED` → `published`; produto `DRAFT` → `draft`; `ARCHIVED` → `null` (fora da lista).
  - `isEditable(status: ListStatus): boolean` — falso só em `review`.
  - Service (transações Prisma):
    - `createProductDraft(sellerId, input: ProductDraftInput): Promise<{ productId: string }>` — `Product` (`instrument: GUITAR`, `productType: kinds[0] ?? 'PRESET'`, `slug: slugify(title || 'produto') + '-' + 6 chars`, `status: DRAFT`) + `ProductRevision` v1 `DRAFT` com todos os campos.
    - `saveProductDraft(sellerId, productId, input): Promise<void>` — acha o produto do vendedor (`where: { id, sellerId }`; senão `ProductNotFoundError`); revisão de trabalho = última com status `DRAFT`/`REJECTED`; se a última é `PENDING_REVIEW` → `ProductLockedError`; se a última é `APPROVED` → cria versão `+1` `DRAFT` copiando os `ProductFile` (novas linhas, mesmas `r2Key`). Grava na revisão; se o produto nunca foi publicado (`publishedAt === null`), grava também `title`, `description`, `shortDescription`, `kinds`, `productType`, `priceCents` no `Product` e regera o slug. Revisão `REJECTED` editada volta para `DRAFT` e limpa `rejectionReason`.
    - `submitProductForReview(sellerId, productId): Promise<void>` — valida a revisão de trabalho com `productSubmitSchema` e `deliverableCount >= 1`; senão `ProductIncompleteError(missing: ChecklistItem['id'][])`; revisão → `PENDING_REVIEW`, `submittedAt: now`; produto `DRAFT`/`REJECTED` → `PENDING_REVIEW` (publicado continua `PUBLISHED`). Sem revisão de trabalho → `ProductLockedError`.
  - Queries: `getSellerProducts(sellerId): Promise<SellerProductRow[]>` com `type SellerProductRow = { id; title; kinds; capturedAmp: string | null; priceCents; salesCount; status: ListStatus; rejectionReason: string | null; coverUrl: string | null; updatedAt }`; `getProductForEdit(sellerId, productId): Promise<ProductEditData | null>` (`null` se não for do vendedor) com `type ProductEditData = { productId; status: ListStatus; draft: ProductDraftInput; files: { id; kind: FileKind; fileName; sizeBytes; url: string | null }[]; founderRemainingSales: number }` (url pública só para prévia e capa).
  - Actions: `createProductDraftAction(input): Promise<ActionResult<{ productId: string }>>`, `saveProductDraftAction(productId, input): Promise<ActionResult<null>>`, `submitProductAction(productId): Promise<ActionResult<null>>` — mapeiam os erros acima para mensagens traduzidas (`errors.json`, namespace `seller`): `productNotFound`, `productLocked`, `productIncomplete` (com `params.missing`). `revalidatePath('/seller/products')` após escrever.

- [ ] **Step 1: Testes que falham**

```ts
test('rascunho aceita vazio; envio exige o básico', () => {
  expect(productDraftSchema.safeParse({}).success).toBe(true)
  const r = productSubmitSchema.safeParse({ kinds: [], title: 'ab', shortDescription: 'curta', priceCents: 999 })
  expect(r.success).toBe(false)
  expect(productSubmitSchema.safeParse({ kinds: ['PRESET'], title: 'Plexi 68', shortDescription: 'Plexi completo em snapshots', priceCents: 1000 }).success).toBe(true)
  expect(productSubmitSchema.safeParse({ kinds: ['IR'], title: 'IR 4x12', shortDescription: 'Quatro IRs de caixa 4x12', priceCents: 0, free: true }).success).toBe(true)
})
test('Outro exige texto e estilos somam no máximo 3', () => {
  expect(productSubmitSchema.safeParse({ ...valid, kinds: ['OTHER'] }).success).toBe(false)
  expect(productDraftSchema.safeParse({ styles: ['Blues','Pop','Jazz'], styleOther: 'Sertanejo' }).success).toBe(false)
})
test('youtubeUrl só aceita YouTube', () => {
  expect(productDraftSchema.safeParse({ youtubeUrl: 'https://youtu.be/abc' }).success).toBe(true)
  expect(productDraftSchema.safeParse({ youtubeUrl: 'https://vimeo.com/1' }).success).toBe(false)
})
test('listStatusOf', () => {
  expect(listStatusOf({ status: 'PUBLISHED' }, { status: 'PENDING_REVIEW' })).toBe('review')
  expect(listStatusOf({ status: 'PUBLISHED' }, { status: 'DRAFT' })).toBe('published')
  expect(listStatusOf({ status: 'REJECTED' }, { status: 'REJECTED' })).toBe('rejected')
  expect(listStatusOf({ status: 'ARCHIVED' }, { status: 'APPROVED' })).toBeNull()
})
test('submitChecklist', () => {
  expect(submitChecklist(validDraft, 0)).toEqual([{ id: 'basics', ok: true }, { id: 'files', ok: false }, { id: 'price', ok: true }])
})
```

Os fluxos com banco (outro vendedor → não encontrado; em análise → bloqueado; envio duplo → bloqueado; editar publicado → nova revisão e `liveRevisionId` igual) ficam no e2e da Tarefa 14, porque o projeto não tem testes de integração com banco.

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** `pnpm test`; PASS.
- [ ] **Step 5:** Anotar commit: `feat(products): add product draft, revision and review submission`.

---

### Task 8: Upload de arquivos do produto

**Files:**
- Modify: `src/lib/env.ts` (`R2_PRIVATE_BUCKET` opcional; `r2ProductsEnabled = r2Enabled && !!R2_PRIVATE_BUCKET`), `src/lib/r2.ts`, `src/server/services/avatarService.ts` (passar o bucket público explicitamente), `.env.example`
- Create: `src/server/services/productFileService.ts` (+ `.test.ts`), actions em `src/actions/productActions.ts`

**Interfaces:**
- Produces:
  - `r2.ts`: `createPresignedPutUrl(bucket: string, key: string, contentType: string, contentLength: number)`; `headObject(bucket, key): Promise<{ contentLength: number; contentType?: string } | null>`; `deleteObject(bucket, key)`.
  - `FILE_RULES: Record<FileKind, { maxBytes: number; contentTypes: string[] | 'any'; maxCount: number; public: boolean }>` — `DELIVERABLE`: 200 MB, `'any'`, 20, privado; `PREVIEW_AUDIO`: 50 MB, `['audio/mpeg','audio/wav','audio/x-wav']`, 1, público, sem limite de duração; `COVER_IMAGE`: 5 MB, `['image/jpeg','image/png','image/webp']`, 1, público.
  - `productFileKey(productId: string, kind: FileKind, fileName: string): string` → `products/{productId}/{kind}/{cuid}-{slugify(nome sem extensão)}.{ext}`.
  - `validateUpload(kind, contentType, sizeBytes): 'ok' | 'typeNotAllowed' | 'tooLarge' | 'empty'`.
  - `keyBelongsTo(key: string, productId: string, kind: FileKind): boolean`.
  - `requestProductUpload(sellerId, input: { productId; kind; fileName; contentType; sizeBytes }): Promise<{ url: string; key: string }>`
  - `confirmProductUpload(sellerId, input: { productId; kind; key; fileName }): Promise<{ fileId: string }>` — exige `keyBelongsTo`, `headObject` com tamanho dentro do limite (senão apaga o objeto e lança); para `maxCount: 1`, substitui o arquivo anterior da revisão de trabalho (apaga a linha; o objeto só sai do R2 se nenhuma outra revisão usar a mesma `r2Key`).
  - `removeProductFile(sellerId, fileId): Promise<void>` — mesmo cuidado com `r2Key` compartilhada.
  - Actions: `requestProductUploadAction`, `confirmProductUploadAction`, `removeProductFileAction`, todas `ActionResult`; arquivo/produto de outro vendedor → `productNotFound`; produto em análise → `productLocked`; sem R2 configurado → `uploadsUnavailable`.
  - Schemas em `productSchema.ts`: `productUploadSchema`, `confirmProductUploadSchema`.

- [ ] **Step 1: Testes que falham**

```ts
test('validateUpload', () => {
  expect(validateUpload('DELIVERABLE', 'application/octet-stream', 48_000)).toBe('ok')
  expect(validateUpload('DELIVERABLE', 'application/zip', 200 * 1024 * 1024 + 1)).toBe('tooLarge')
  expect(validateUpload('PREVIEW_AUDIO', 'audio/ogg', 1000)).toBe('typeNotAllowed')
  expect(validateUpload('COVER_IMAGE', 'image/png', 0)).toBe('empty')
})
test('keyBelongsTo recusa outro produto, outro tipo e path traversal', () => {
  const key = productFileKey('p1', 'DELIVERABLE', 'Plexi 68.hlx')
  expect(key).toMatch(/^products\/p1\/DELIVERABLE\/[a-z0-9]+-plexi-68\.hlx$/)
  expect(keyBelongsTo(key, 'p1', 'DELIVERABLE')).toBe(true)
  expect(keyBelongsTo(key, 'p2', 'DELIVERABLE')).toBe(false)
  expect(keyBelongsTo(key, 'p1', 'COVER_IMAGE')).toBe(false)
  expect(keyBelongsTo('products/p1/DELIVERABLE/../../p2/x', 'p1', 'DELIVERABLE')).toBe(false)
})
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar; `DELIVERABLE` vai para `R2_PRIVATE_BUCKET`, os públicos para `R2_PUBLIC_BUCKET`. Documentar no `.env.example` que o bucket privado precisa de CORS liberando `PUT` da origem do app.
- [ ] **Step 4:** `pnpm test`; PASS.
- [ ] **Step 5:** Anotar commit: `feat(products): add signed uploads for pack files, preview and cover`.

---

### Task 9: Meus produtos (`/seller/products`)

**Files:**
- Create: `src/app/(seller)/seller/products/page.tsx`, `src/components/seller/products/{ProductList,ProductRow,StatusFilter,ProductSearch}.tsx`, `src/components/seller/products/ProductList.test.tsx`

**Interfaces:**
- Consumes: `getSellerProducts`, `ListStatus`, `formatCurrency`.
- Produces:
  - Página com `searchParams: Promise<{ situacao?: ListStatus | 'all'; q?: string }>`; filtro e busca no servidor sobre a lista já carregada (normalização sem acento, `includes`).
  - `<StatusFilter counts current />`: grupo `role="group" aria-label="Filtrar por situação"` de links-pílula com `aria-current` (Todos, Publicados, Em análise, Rascunhos, Precisam de ajuste) e contagem.
  - `<ProductSearch defaultValue />` (client): `type="search"`, "Buscar pelo nome", atualiza `?q=` com debounce de 300 ms (`useDebounce` novo em `src/hooks/useDebounce.ts` se não existir).
  - `<ProductRow product />`: **um só componente responsivo**. Abaixo de `md`: cartão (capa 56px, título, meta, selo de situação, motivo em caixa vermelha clara, grade 2 colunas Preço/Vendas em fundo creme, botão de ação ocupando a largura). De `md` para cima: linha (capa 88×56, título + meta + motivo, Preço 110px, Vendas 90px, selo 140px, ação à direita). Sem "Ver página do produto" (removido pelo usuário).
  - Ação por situação: `published` "Editar", `review` "Ver envio", `draft` "Continuar", `rejected` "Corrigir" → `/seller/products/{id}/edit`.
  - Meta: tipos juntos por " + " (Preset, IR, Capture, o texto de `kindOther`) e, se houver, " · " + `capturedAmp`. Vendas "—" se não publicado. Preço "Grátis" se 0. Capa: `coverUrl` ou degradê alternado (`ardosia→celeste`, `marinho→azul`, `noite→ardosia`) com a sigla PST/IR/CAP.
  - Vazio: "Nada por aqui" / "Nenhum produto nessa situação. Os outros filtros mostram o resto." Sem nenhum produto: mesmo cartão com botão "Novo produto".
  - Rodapé: "Todo produto novo ou editado passa por análise antes de aparecer na loja. Você recebe um e-mail quando ela termina." (o e-mail é da fase do admin; manter o texto).

- [ ] **Step 1: Teste que falha**

```tsx
test('linha recusada mostra motivo e ação Corrigir', () => {
  renderWithIntl(<ProductList products={[row({ status: 'rejected', rejectionReason: 'a prévia corta antes do fim.' })]} />)
  expect(screen.getByText('Motivo: a prévia corta antes do fim.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Corrigir' })).toHaveAttribute('href', '/seller/products/p1/edit')
  expect(screen.getByText('—')).toBeInTheDocument()
})
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add my products page`.

---

### Task 10: Formulário do produto em 5 etapas

**Files:**
- Create: `src/app/(seller)/seller/products/new/page.tsx`, `src/app/(seller)/seller/products/[id]/edit/page.tsx`, `src/components/seller/productForm/{ProductWizard,WizardStepper,WizardNavBar,StepInfo,StepClassification,StepFiles,StepPrice,StepReview,StorePreviewCard,SubmitChecklist,FileUploader,PreviewPlayer}.tsx`, `src/components/seller/productForm/wizardSteps.ts`, testes `ProductWizard.test.tsx`, `StepPrice.test.tsx`
- Install: `pnpm dlx shadcn@latest add textarea` (e usar `switch`, `field`, `input`, `button` já existentes)

**Interfaces:**
- Consumes: `ProductEditData`, `productDraftSchema`, `submitChecklist`, `isEditable`, `parseBrlToCents`, `saleBreakdown`/`estimateProcessingCents`, `SELLER_RULES`, `STYLE_OPTIONS`, actions das Tarefas 7 e 8.
- Produces:
  - `WIZARD_STEPS = [{ n: 1, key: 'info' }, { n: 2, key: 'classification' }, { n: 3, key: 'files' }, { n: 4, key: 'price' }, { n: 5, key: 'review' }] as const`; rótulos "Informações", "Classificação", "Arquivos e links", "Preço", "Revisar e enviar".
  - `stepComplete(step: 1|2|3|4|5, draft, deliverableCount): boolean` — 1: básico do checklist; 2 e 3 e 5: `true`; 4: preço válido ou gratuito.
  - `<ProductWizard initial={ProductEditData | null} step={1..5} />` (client): estado do rascunho em `useState`; etapa vem de `?etapa=` (inválida → 1). "Continuar" e "Salvar rascunho" salvam: sem `productId` chama `createProductDraftAction` e faz `router.replace('/seller/products/{id}/edit?etapa={n+1}')`; com `productId`, `saveProductDraftAction` e `router.push('?etapa=…')`. "Voltar" não salva. Clique numa etapa do stepper salva e navega. Erro de action vira `toast.error` (sonner). "Salvar rascunho" mostra `toast.success('Rascunho salvo')`. Status `review`: campos `disabled`, faixa "Em análise. Você poderá editar quando a análise terminar." e nada de salvar/enviar.
  - Etapa 3 exige `productId` (existe sempre a partir da etapa 2, porque avançar salva).
  - `<WizardStepper steps current onGo />`: de `lg` para cima, 5 botões com número/✓, rótulo e estado ("Concluída", "Falta algo" em vermelho para etapas anteriores incompletas, nada para futuras), `aria-current="step"`. Abaixo de `lg`: rótulo da etapa atual + "Etapa N de 5" e 5 segmentos clicáveis (`aria-label` = rótulo).
  - `<WizardNavBar />`: Voltar (linha), Salvar rascunho (fantasma), "Etapa N de 5" (só `lg+`), Continuar / "Enviar para análise" (desabilitado com checklist incompleto, com texto "Para enviar falta: …" acima). Abaixo de `lg`: `sticky bottom-0`, fundo branco com borda superior, botões em linha ocupando a largura.
  - Layout: `grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]`; coluna lateral `hidden lg:block lg:sticky lg:top-6` com `StorePreviewCard` (eyebrow "Como aparece na loja"; tipo em maiúsculas, título, até 4 estilos como chips, descrição curta, preço/"GRÁTIS", "COMPRAR"/"BAIXAR"; reaproveite `ProductCard` se ele aceitar os dados sem prender a lógica de rota — senão componha com as mesmas classes) e `SubmitChecklist`.
  - Etapa 1 (canvas): cartões de tipo com caixa de seleção, 2 colunas `md+` e 1 no celular (`aria-pressed`), campo "O que mais vem no pack?" quando Outro; "Sobre o produto": nome, descrição curta com "N de 120 caracteres", "Sobre o pack" (textarea), lista "O que vem no pack" com remover (`aria-label="Remover {item}"`) e campo + "Adicionar item".
  - Etapa 2: "Estilo (opcional)" chips com "N de 3" e "Outro" com campo "Qual estilo?"; chip desabilitado ao atingir 3. "Detalhes da captura" só se Capture marcado: "Amplificador capturado" e radiogroup "O que foi capturado" (Só o amplificador, Amplificador com caixa, Pedal, Outro + campo).
  - Etapa 3: `FileUploader` para "Arquivos do pack" (múltiplos, lista com nome, tamanho em KB/MB e remover; "qualquer formato · até 200 MB"), "Prévia em áudio (opcional)" (um arquivo; com arquivo, `PreviewPlayer` noite com play/pausa usando `<audio>` e a URL pública; texto "Ajuda quem vai comprar a ouvir o som antes. Toque no equipamento do pack, sem música de terceiros."), "Capa (opcional)" ("Enviar imagem 16:10"). Fluxo do `FileUploader`: `requestProductUploadAction` → `fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })` com barra de progresso (`XMLHttpRequest.upload.onprogress`) → `confirmProductUploadAction` → `router.refresh()`. Sem R2: mensagem `uploadsUnavailable` e botão desabilitado. "Links": "Vídeo no YouTube (opcional)".
  - Etapa 4: `<StepPrice priceCents free founderRemainingSales onChange />`: campo com prefixo "R$", `inputMode="decimal"`, ajuda "Mínimo de R$ 10,00. Você pode mudar depois." / erro "O preço mínimo é R$ 10,00." (borda vermelha, `aria-invalid`) / "Produtos gratuitos não pagam comissão nem taxa."; `Switch` "Produto gratuito" desabilita o campo; quadro ao lado (abaixo no celular): Preço, Comissão Amplifica (15%), Taxa da Stripe (estimada), Você recebe por venda; nota de Fundador só se `founderRemainingSales > 0` e não gratuito: "Como vendedor fundador, nas suas N vendas isentas restantes você recebe R$ X por venda."
  - Etapa 5: `<dl>` resumo (Tipo, Nome, Estilo, Arquivos "N arquivos do pack · com prévia em áudio"/"sem prévia", Preço "R$ X (você recebe R$ Y)" ou "Gratuito") com "Editar" levando à etapa; aviso de sugestões quando há `kindOther`, `styleOther` ou `captureKindOther`: "Você sugeriu itens novos: …. Eles já aparecem no seu produto e vão para a revisão da equipe; se aprovados, viram opção para todos os vendedores." "Enviar para análise" chama `submitProductAction` e vai para `/seller/products?situacao=review` com `toast.success('Enviado para análise')`.
  - Página `new`: `requireSeller()` e `<ProductWizard initial={null} step={1} />` (etapas > 1 sem id → 1). Página `edit`: `getProductForEdit`; `null` → `notFound()`.

- [ ] **Step 1: Testes que falham**

```tsx
test('StepPrice calcula o líquido e bloqueia abaixo de R$ 10', async () => {
  const onChange = vi.fn()
  renderWithIntl(<StepPrice priceCents={6792} free={false} founderRemainingSales={3} onChange={onChange} />)
  expect(screen.getByText('R$ 54,63')).toBeInTheDocument() // 6792 − 1019 − 310
  expect(screen.getByText(/nas suas 3 vendas isentas restantes você recebe R\$ 64,82/)).toBeInTheDocument()
  await userEvent.clear(screen.getByLabelText('Preço de venda'))
  await userEvent.type(screen.getByLabelText('Preço de venda'), '9,99')
  expect(screen.getByLabelText('Preço de venda')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('O preço mínimo é R$ 10,00.')).toBeInTheDocument()
})
test('Enviar fica desabilitado sem arquivo do pack e lista o que falta', () => {
  renderWithIntl(<ProductWizard initial={editData({ files: [] })} step={5} />)
  expect(screen.getByRole('button', { name: 'Enviar para análise' })).toBeDisabled()
  expect(screen.getByText('Para enviar falta: arquivos do pack enviados.')).toBeInTheDocument()
})
test('produto em análise abre só leitura', () => {
  renderWithIntl(<ProductWizard initial={editData({ status: 'review' })} step={1} />)
  expect(screen.getByLabelText('Nome do produto')).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).toBeNull()
})
```
No formulário ainda não existe pedido, então a comissão exibida é `round(preço × 1500 / 10000)` e a taxa é `estimateProcessingCents(preço)`. O Fundador recebe 6792 − 310 = R$ 64,82. `formatCurrency` usa espaço não separável depois de "R$": normalize ao comparar.

- [ ] **Step 2:** FAIL. **Step 3:** implementar, mockando `next/navigation` e as actions nos testes. **Step 4:** PASS.
- [ ] **Step 5:** Anotar commit: `feat(products): add five-step product form with uploads`.

---

### Task 11: Carteira (`/seller/wallet`)

**Files:**
- Create: `src/app/(seller)/seller/wallet/page.tsx`, `src/components/seller/wallet/{BalanceCards,Releases,Statement,StatementFilter}.tsx`, `src/components/seller/wallet/Releases.test.tsx`

**Interfaces:**
- Consumes: `getSellerItems`, `walletSummary`, `upcomingReleases`, `buildStatement`, `StatusBadge`.
- Produces:
  - Página com `searchParams: Promise<{ filtro?: 'all'|'sales'|'refunds'|'transfers' }>`; extrato mostra as 50 linhas mais recentes do filtro.
  - `<BalanceCards summary />`: 3 cartões em `grid gap-4 md:grid-cols-3` (no celular, um abaixo do outro — o usuário pediu que voltassem ao normal): "Disponível para saque" em fundo noite, valor grande, "Vai para a conta cadastrada na Stripe." (sem botão de saque); "Retido" com "N vendas aguardando os 30 dias. A próxima libera em 7 de dezembro."; "Recebido desde o início" com "Já transferido: R$ X." (o canvas diz "Já sacado"; troquei por "transferido" porque não há saque ainda — decisão minha, ver handoff).
  - `<Releases releases />`: `ol` em `grid grid-cols-3 gap-2 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] md:gap-3`; cada item data ("7 dez"), valor, "1 venda"/"N vendas"; abaixo de `md` o 4º item fica `hidden` (`max-md:[&:nth-child(n+4)]:hidden`), valor `text-sm` no celular e `text-xl` no desktop. Vazio: "Nenhum valor retido agora."
  - `<StatementFilter current />`: pílulas Tudo, Vendas, Reembolsos, Transferências (`aria-current`), links `?filtro=`.
  - `<Statement rows />`: tabela com rolagem horizontal: Data, Movimento ("Venda · {produto}", "Reembolso · {produto}", "Transferência para sua conta Stripe"), Valor, Comissão ("Isenta"/"—"), Taxa, Líquido (negativo em vermelho), Situação.
  - Cabeçalho "Carteira" / "Seu dinheiro" / "Cada venda fica retida por 30 dias, o tempo do prazo de reembolso e da conferência do pagamento. Depois disso o valor fica disponível para saque."

- [ ] **Step 1: Teste que falha**

```tsx
test('Releases mostra até 4 e esconde o 4º no celular por CSS', () => {
  renderWithIntl(<Releases releases={fourReleases} />)
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(4)
  expect(items[3].className).toMatch(/max-md:/)
  expect(within(items[1]).getByText('2 vendas')).toBeInTheDocument()
})
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add wallet page`.

---

### Task 12: Perfil do vendedor (`/seller/profile`)

**Files:**
- Create: `src/app/(seller)/seller/profile/page.tsx`, `src/components/seller/profile/{SellerProfileForm,CreatorPreview}.tsx`, `src/components/seller/profile/SellerProfileForm.test.tsx`
- Modify: `src/schemas/sellerSchema.ts` (+ teste), `src/server/services/sellerService.ts`, `src/actions/sellerActions.ts`, `src/components/account/AvatarUpload.tsx` (só se precisar de variante com lápis)

**Interfaces:**
- Produces:
  - `PROFILE_DEVICES = ['Line 6','Kemper','Boss','Fractal','Mooer','Valeton','M-Vave','Zoom'] as const`.
  - `sellerProfileSchema = z.object({ displayName (2..40), bio: max 400 opcional, city: max 60 opcional, devices: z.array(z.enum(PROFILE_DEVICES)).max(8), instagram, tiktok: handle /^[A-Za-z0-9._]{1,30}$/ opcional ou '', youtube: /^[A-Za-z0-9._-]{1,100}$/ opcional ou '', spotifyUrl: URL que começa com https://open.spotify.com/ opcional ou '' })`. `@` digitado no começo é removido antes de validar.
  - `updateSellerProfile(sellerId, input): Promise<void>`; `updateSellerProfileAction(input): Promise<ActionResult<null>>` com `revalidatePath('/seller', 'layout')`.
  - `<CreatorPreview name bio city devices socials isFounder imageUrl />`: bloco "Quem criou este pack" (eyebrow "Como aparece na página do produto", avatar com iniciais/foto e selo Fundador, nome em `font-display`, linha "Vendedor fundador · Line 6 e Kemper", bio, ícones das redes preenchidas, "Outros produtos de {primeiro nome}"), seguido de "A prévia muda enquanto você edita os campos abaixo." Fica **no topo** da página, acima do formulário, em todas as larguras.
  - `<SellerProfileForm initial />` (client): cartões "Quem é você" (avatar com botão lápis 36px sobreposto no canto, `aria-label="Mudar foto"`, usando o upload de avatar da conta; Nome de vendedor; Sobre você com "N de 400 caracteres. Conte há quanto tempo toca, onde usa seus presets e como testa."; Cidade (opcional)), "Equipamento que você usa" (chips `aria-pressed` com ✓), "Redes sociais (opcional)" (Instagram "@", YouTube "youtube.com/@", TikTok "@", Spotify "link", grade 2 colunas `md+`). "Salvar alterações" → `role="status"` "Alterações salvas"; erros por campo via `field.tsx`. A prévia atualiza a cada tecla.

- [ ] **Step 1: Testes que falham**

```tsx
test('prévia acompanha o nome e os equipamentos', async () => {
  renderWithIntl(<SellerProfileForm initial={profile({ displayName: 'Tiago Ramos', devices: ['Line 6'] })} />)
  await userEvent.clear(screen.getByLabelText('Nome de vendedor'))
  await userEvent.type(screen.getByLabelText('Nome de vendedor'), 'Tiago R.')
  await userEvent.click(screen.getByRole('button', { name: 'Kemper' }))
  const preview = screen.getByRole('region', { name: 'Prévia: como aparece na página do produto' })
  expect(within(preview).getByText('Tiago R.')).toBeInTheDocument()
  expect(within(preview).getByText(/Line 6 e Kemper/)).toBeInTheDocument()
})
test('sellerProfileSchema limpa @ e recusa spotify de outro site', () => {
  expect(sellerProfileSchema.parse({ ...base, instagram: '@tiago.tone' }).instagram).toBe('tiago.tone')
  expect(sellerProfileSchema.safeParse({ ...base, spotifyUrl: 'https://evil.com/x' }).success).toBe(false)
})
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Anotar commit: `feat(seller): add seller profile page with live preview`.

---

### Task 13: Recebimentos (`/seller/payouts`, só status)

**Files:**
- Create: `src/app/(seller)/seller/payouts/page.tsx`

**Interfaces:**
- Consumes: `requireSeller`.
- Produces: página com cabeçalho "Recebimentos", cartão com o status (`NOT_STARTED` "Não conectado", `PENDING` "Em análise na Stripe", `VERIFIED` "Conectado", `RESTRICTED` "Precisa de atenção na Stripe") e o texto "Seus produtos já podem ser publicados, mas só ficam à venda depois que você conecta a conta de recebimento. O cadastro e os documentos ficam com a Stripe, não com a Amplifica." O botão "Conectar recebimento" fica desabilitado com a nota "A conexão com a Stripe chega na próxima etapa." (decisão minha: não criar botão que não faz nada).

- [ ] **Step 1:** implementar (página só de composição, sem lógica a testar).
- [ ] **Step 2:** `pnpm lint && pnpm exec tsc --noEmit && pnpm test`; PASS.
- [ ] **Step 3:** Anotar commit: `feat(seller): add payouts status page`.

---

### Task 14: E2E, revisão de UI e performance

**Files:**
- Create: `e2e/seller.spec.ts`
- Modify: `e2e/perf/navigation.perf.spec.ts` (se o test-engineer achar necessário cobrir `/seller`)

- [ ] **Step 1: Escrever `e2e/seller.spec.ts`** (reaproveite o `signUpAndLogin` de `e2e/account.spec.ts`, extraindo-o para `e2e/helpers/session.ts`):
  - `'vendedor novo: vira vendedor, cria rascunho, vê checklist'` — cadastro → `/seller` redireciona para `/becomeSeller` → preenche nome → cai no Painel com "Seu primeiro preset está perto" → "Novo produto" → marca Preset, preenche nome/descrição → Continuar → URL `/seller/products/{id}/edit?etapa=2` → volta em Meus produtos e vê o produto em "Rascunhos" com "Continuar".
  - `'envio bloqueado sem arquivo do pack'` — etapa 5 com botão "Enviar para análise" desabilitado e "Para enviar falta: arquivos do pack enviados."
  - `'outro vendedor não abre o produto'` — segundo usuário vendedor abre a URL de edição do primeiro → página 404.
  - `'celular: menu hambúrguer navega'` — `page.setViewportSize({ width: 390, height: 844 })`; sem barra lateral visível; abre o menu, clica "Carteira", vê "Seu dinheiro"; sem rolagem horizontal da página (`document.documentElement.scrollWidth <= 390`).
  - Se `R2_PRIVATE_BUCKET` estiver no `.env.e2e`: `'envia arquivo do pack e manda para análise'` — sobe um arquivo pequeno, envia, vê "Em análise" na lista e o formulário só leitura. Senão `test.skip` com o motivo.
- [ ] **Step 2:** `pnpm test:e2e e2e/seller.spec.ts`. Esperado: PASS (o upload pode ficar como skip).
- [ ] **Step 3:** Rodar o agente `test-engineer` (exigido pelo CLAUDE.md para UI/banco/auth) sobre a branch e, depois, o `code-reviewer`. Corrigir o que for Crítico/Alto.
- [ ] **Step 4:** Revisar cada tela em 390px e 1440px com a skill `run`/navegador, comparando com o canvas (sem rolagem horizontal, alvos de 44px, foco visível).
- [ ] **Step 5:** Anotar commit: `test(e2e): cover seller area flows`.

---

## Decisões minhas (para o usuário conferir)

1. Taxa da Stripe nas vendas, carteira e painel é **estimada** por `SELLER_RULES` até o checkout gravar a taxa real.
2. Novos vendedores nascem com `isFounder = false`; Fundador é marcado pelo Prisma Studio até a pergunta 3 do spec ser respondida. "Dias de programa" só aparece se `FOUNDER_PROGRAM_STARTS_AT` estiver configurada.
3. Extrato usa "Transferência para sua conta Stripe" no lugar de "Saque", e o cartão diz "Já transferido", porque ainda não existe saque.
4. Onboarding em `/becomeSeller`, fora da área `/seller`.
5. Recebimentos mostra só o status, com o botão de conectar desabilitado.
6. Prévia em áudio: mp3 ou wav até 50 MB; capa: jpg/png/webp até 5 MB; pack: até 200 MB por arquivo, até 20 arquivos.
7. Editar um produto publicado cria revisão nova; editar produto em análise não é permitido.
