# Arquitetura

## Árvore de pastas

```
amplifica/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                     # dados fake de categorias, vendedores e produtos para dev
├── prisma.config.ts                # Prisma 7: config de datasource/migrations fica fora do schema
├── public/
├── .env / .env.example
└── src/
    ├── proxy.ts                    # Next 16 (antigo middleware.ts): só redirect OTIMISTA por cookie, não é segurança
    │
    ├── app/                        # SOMENTE roteamento e composição. Nenhum acesso direto ao Prisma aqui.
    │   ├── (public)/               # Loja aberta: SEO, cache agressivo
    │   │   ├── layout.tsx          # header/footer da loja
    │   │   ├── page.tsx            # home
    │   │   ├── produtos/
    │   │   │   ├── page.tsx        # catálogo, filtros via searchParams (URL = estado compartilhável)
    │   │   │   └── [slug]/page.tsx
    │   │   ├── busca/page.tsx
    │   │   └── lojas/[sellerSlug]/page.tsx   # vitrine pública de cada vendedor
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── cadastro/page.tsx
    │   ├── (customer)/             # Exige sessão de cliente
    │   │   ├── layout.tsx          # guard de UX: redirect se não logado
    │   │   ├── carrinho/page.tsx
    │   │   ├── checkout/page.tsx
    │   │   └── conta/
    │   │       ├── perfil/page.tsx
    │   │       └── pedidos/
    │   │           ├── page.tsx
    │   │           └── [orderId]/page.tsx
    │   ├── (seller)/
    │   │   └── vendedor/           # URL /vendedor/*
    │   │       ├── layout.tsx      # sidebar do dashboard + guard role SELLER
    │   │       ├── page.tsx        # métricas
    │   │       ├── produtos/
    │   │       │   ├── page.tsx
    │   │       │   ├── novo/page.tsx
    │   │       │   └── [id]/editar/page.tsx
    │   │       ├── carteira/page.tsx     # saldo retido, disponível, extrato, saque
    │   │       └── pedidos/page.tsx
    │   ├── (admin)/
    │   │   └── admin/              # URL /admin/*
    │   │       ├── layout.tsx      # guard role ADMIN
    │   │       ├── vendedores/page.tsx   # aprovação/bloqueio de conta de vendedor
    │   │       ├── produtos/page.tsx     # fila de moderação de produto novo
    │   │       └── pedidos/page.tsx      # reembolsos, disputas
    │   ├── api/
    │   │   └── webhooks/
    │   │       └── payments/route.ts     # Route Handlers só para o que PRECISA ser HTTP (webhooks, integrações)
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   └── globals.css
    │
    ├── components/
    │   ├── ui/                     # Design system burro: Button, Input, Modal. Zero regra de negócio.
    │   ├── layout/                 # Header, Footer, SellerSidebar, AdminSidebar
    │   ├── product/                # ProductCard, ProductGrid, ProductGallery, CatalogFilters
    │   ├── cart/                   # CartDrawer, CartItem, AddToCartButton
    │   ├── checkout/
    │   ├── order/                  # OrderStatusBadge, OrderTimeline
    │   └── seller/                 # ProductForm, WalletCards, MetricsCards
    │
    ├── actions/                    # "use server" — TODA escrita no banco passa por aqui
    │   ├── cartActions.ts
    │   ├── orderActions.ts
    │   ├── productActions.ts
    │   ├── sellerActions.ts
    │   └── userActions.ts
    │
    ├── server/                     # Código que JAMAIS vai para o bundle do client ("server-only")
    │   ├── queries/                # Leituras (data fetching) chamadas por Server Components
    │   │   ├── productQueries.ts
    │   │   ├── orderQueries.ts
    │   │   ├── sellerQueries.ts
    │   │   └── metricsQueries.ts
    │   ├── services/               # Regras de negócio com transação, reutilizadas por várias actions/webhooks
    │   │   ├── checkoutService.ts  #   cria pedido + libera acesso ao download + divide comissão (15%) por vendedor
    │   │   └── walletService.ts    #   retenção de 30 dias, liberação de saldo, isenção de fundador
    │   └── dto/                    # Model do Prisma -> objeto serializável e seguro para o client
    │       └── productDto.ts       #   (Decimal -> number/string, remove campos internos)
    │
    ├── schemas/                    # Zod. Isomórfico: importado pelo form (client) E pela action (server)
    │   ├── commonSchema.ts         # id, paginação, dinheiro em centavos, slug
    │   ├── productSchema.ts
    │   ├── cartSchema.ts
    │   ├── orderSchema.ts
    │   └── userSchema.ts
    │
    ├── stores/                     # Zustand: estado de UI do client, NUNCA fonte de verdade de dados do banco
    │   ├── cartStore.ts
    │   └── uiStore.ts              # drawer aberto, modais, etc.
    │
    ├── hooks/                      # Hooks client genéricos ou de domínio
    │   ├── useDebounce.ts
    │   └── useCart.ts              # une o store com as actions de sincronização
    │
    ├── lib/                        # Infraestrutura e utilitários sem regra de negócio
    │   ├── prisma.ts               # singleton do PrismaClient (único import de @/generated/prisma)
    │   ├── auth.ts                 # getSession(), requireUser(), requireRole()
    │   ├── actionResult.ts         # tipo padrão de retorno das actions
    │   └── utils.ts                # cn(), formatCurrency(), slugify()
    │
    ├── types/                      # Tipos globais que não vêm de Zod nem do Prisma
    │   └── auth.d.ts               # augment de sessão (role, sellerId)
    │
    └── generated/prisma/           # Client gerado pelo Prisma 7 (no .gitignore)
```

## Convenção de nomes

**Pastas: sempre camelCase.** `sellerDashboard`, não `seller-dashboard`. Exceção: quando o Next.js exige um nome/formato específico e não aceita camelCase — nesses casos, usar o nome exatamente como o framework exige, mesmo que fuja da convenção. Exemplos já conhecidos:
- Route groups: `(public)`, `(auth)`, `(customer)`, `(seller)`, `(admin)`
- Segmentos dinâmicos: `[slug]`, `[id]`, `[orderId]`, `[sellerSlug]`
- Arquivos especiais reservados do framework: `page.tsx`, `layout.tsx`, `route.ts`, `not-found.tsx` (kebab-case obrigatório, não é escolha)

Ao criar um arquivo/pasta novo com nome reservado do Next.js que não esteja nessa lista, seguir o nome exato exigido pela documentação do framework (consultar via Context7), não forçar camelCase por cima.

**Arquivos: camelCase, com sufixo de papel quando aplicável.** `productActions.ts`, `checkoutService.ts`, `cartStore.ts` — nunca kebab-case (`product-actions.ts`) nem PascalCase fora de componente React. Componente React é a única exceção: `ProductCard.tsx`, `CartDrawer.tsx`, em PascalCase.

## Regra de dependência (a mais importante)

```
app/  →  actions/ e server/queries/  →  server/services/  →  prisma
```

- `app/` nunca importa `@/generated/prisma` diretamente — sempre passa por `actions/` (escrita) ou `server/queries/` (leitura)
- `server/` nunca importa de `app/` nem de `components/` — é invisível pro client por definição (`server-only`)
- Um módulo de domínio (produto, pedido, carteira) não chama outro módulo de domínio direto dentro de `services/` — se `checkoutService` precisa mexer em saldo, ele chama uma função exportada de `walletService`, nunca acessa Prisma de carteira por conta própria
- `stores/` (Zustand) guarda só estado de UI client — nunca dado que deveria vir do banco; carrinho no Zustand é rascunho local, a fonte de verdade do pedido pago é sempre o Prisma

## O que cada pasta nunca deve conter

- `components/ui/`: zero regra de negócio, zero chamada a `actions/` ou `fetch`
- `actions/`: zero lógica complexa — só valida (Zod) → chama `server/services/` → retorna `ActionResult`
- `lib/`: zero regra de negócio específica do domínio — só infraestrutura reutilizável
- `schemas/`: zero acesso a banco — só forma e validação de dado

## Teste rápido pra decidir onde um arquivo novo vai

1. É rota ou composição de página? → `app/`
2. É escrita no banco disparada por form/botão? → `actions/`
3. É leitura de banco usada por Server Component? → `server/queries/`
4. É regra de negócio com transação, reutilizada em mais de um lugar? → `server/services/`
5. É forma/validação de dado? → `schemas/`
6. É estado só de UI, sem persistir no banco? → `stores/`
7. Nenhum dos anteriores e não tem regra de negócio? → `lib/`