# Contexto do Amplifica — Fase 1: Modelagem de Dados

## O que é o Amplifica

Marketplace brasileiro multi-vendedor de produtos digitais de timbre para músicos. Não existe hoje no Brasil um marketplace multi-vendedor e multi-instrumento desse tipo.

**Tipos de produto:**

- Presets (Kemper, Line 6 Helix, Neural DSP Quad Cortex, IK ToneX, plugins Neural DSP)
- IRs (impulse responses)
- Captures (tone match)
- Patches para pedaleiras MIDI
- Bundles (pacotes de produtos)

**Instrumentos:** o MVP lança só com guitarra, mas o banco precisa ser multi-instrumento desde o dia 1 (baixo e violão já estão planejados).

**Enquadramento legal:**

- Todo produto é 100% autoral do vendedor.
- Referência a artistas é sempre "inspirado em", nunca endosso oficial.

## Contas e papéis

- Conta única para comprador e vendedor. Ninguém cria conta separada para vender.
- Virar vendedor é um "upgrade" dentro da própria conta.
- Existe papel de admin (revisão de produtos).

## Vendedores

- Onboarding financeiro (KYC) é feito pelo Stripe Connect, em formulário hospedado pelo Stripe.
- O banco não guarda dados bancários nem documentos; só o identificador da conta no Stripe e o status dela.
- KYC só é exigido antes do primeiro repasse, não para publicar produto.
- O tipo de conta (pessoa física ou CNPJ) é escolhido no onboarding do Stripe, não no cadastro, e é permanente depois de verificado.

**Founding sellers:** 4 a 6 vendedores recrutados antes do lançamento. Benefícios:

- Selo de Founder
- Prioridade na home
- 0% de comissão nas 10 primeiras vendas de cada founder, válido por 90 dias após o lançamento (as taxas do Stripe continuam valendo)

## Produtos

- O vendedor define o preço livremente.
- Todo produto novo passa por revisão manual antes de ir ao ar (fase de founding sellers). Esse gate é independente do KYC financeiro.
- Edições depois de publicado também passam por revisão antes de chegarem aos compradores.
- Quando sai uma nova versão de um produto já comprado, os compradores anteriores recebem notificação na navbar.
- Arquivos ficam no R2; o banco guarda referências aos arquivos, não URLs assinadas.
- Prévia de áudio é um arquivo separado do produto entregue.
- Filtros do catálogo previstos: instrumento, tipo de produto, compatibilidade (aparelho/plugin), vendedor e status, além de categorias e tags (ex.: gênero musical).

## Compra e pagamento

- Comissão da plataforma: 15% fixo por venda. Não há assinatura.
- Pagamento via Stripe Connect; o split acontece na transação.
- Compra duplicada de um produto que o usuário já tem é bloqueada com aviso.
- Sem nota fiscal no MVP.

## Pós-compra

- Downloads permanentes e ilimitados.
- O acesso só é revogado se a compra for reembolsada.

## Reembolso

- Janela de 7 dias após a compra (modelo Hotmart).
- Self-service: o comprador clica, informa um motivo (registrado, mas não bloqueia) e o reembolso é processado automaticamente, sem aprovação de admin.
- Reembolso em dinheiro, não em crédito.
- O valor sai do saldo retido do vendedor, não da comissão da plataforma.
- Reembolso revoga o acesso ao produto.

## Repasse ao vendedor

- Saldo fica retido por 30 dias após a venda antes de poder ser sacado.

## Tarefa da Fase 1

**Objetivo:** schema completo desenhado antes de escrever qualquer tela.

1. Modelar as entidades: `User`, `SellerProfile`, `Product`, `Order`, `OrderItem`, `Download`, `Refund`, `Notification`, `Category`/`Tag` (e as que forem necessárias para as regras acima, como as exigidas pelo adapter do Auth.js e o controle de idempotência de webhooks do Stripe).
2. Definir os enums: `Instrument`, `ProductType`, `ProductStatus`, `OrderStatus`, `UserStatus`, `SellerStatus`, `RefundStatus` (e outros que as regras exigirem).
3. Criar índices nas colunas de filtro: `instrument`, `productType`, `compatibility`, `sellerId`, `status`.
4. Rodar a primeira migration.
5. Criar um script de seed com dados fake para desenvolver sem cadastro manual. O seed deve cobrir:
   - Guitarra e alguns produtos de outro instrumento
   - Todos os tipos e status de produto
   - Founders e vendedores comuns
   - Compras pagas e reembolsadas
   - Notificações