# Área do vendedor (`/seller`) — design

Data: 2026-11-10 · Status: rascunho para aprovação
Referência visual: canvas "Amplifica — Área do vendedor" (claude.ai/artifact/KETYDZu5RiECjFfEdybHqC), visual v4 (azul `#2563eb`, noite `#0a1626`, creme `#f6f3f2`, Archivo expandida).

## Por que

Os produtos e avaliações que hoje aparecem na loja são dados de exemplo (`src/components/product/sampleProducts.ts`), criados só para desenhar a interface. Num marketplace o catálogo vem dos vendedores, então a área do vendedor vem antes da vitrine ler do banco: quando um vendedor conseguir publicar, a home e a página de produto passam a mostrar produtos reais.

A promessa da landing `/sell` guia as decisões: **publicar não exige dado bancário, só vender exige**, e o vendedor não monta site.

## Tipos de usuário (decisão do usuário)

Existem **dois tipos de usuário**: o **usuário normal** (compra) e o **vendedor** (compra e vende). Um vendedor é um usuário normal que ativou o perfil de vendedor (`SellerProfile`); o admin continua existindo só para operação interna.

**Não existe "loja" do vendedor.** Os produtos são atrelados ao vendedor, e o que aparece para o comprador é o nome e a apresentação dele na página do produto ("Quem criou este pack"). Não há página de loja, endereço de loja (`/stores/<slug>`) nem item "Minha loja" na área do vendedor. O `slug` do `SellerProfile` fica só como identificador interno.

## Objetivos

1. Quem tem conta vira vendedor em poucos passos, sem informar banco.
2. O vendedor cria, edita e envia produtos para análise; vê em que situação cada um está e, se recusado, o motivo.
3. O vendedor entende quanto vai receber por venda antes de publicar (comissão, taxa, isenção de Fundador).
4. O vendedor vê as vendas de **qualquer mês** com facilidade; por padrão, o mês atual, que vira sozinho quando o mês acaba.
5. O vendedor acompanha o dinheiro: retido, disponível, extrato.
6. O vendedor conecta a conta de recebimento (Stripe Connect, KYC hospedado) quando quiser vender.

## Fora do escopo desta etapa

- Checkout, carrinho e pagamento do comprador (fase própria). Até lá, vendas, saldo e extrato mostram estado vazio.
- Tela de admin para aprovar/recusar produto. No começo a aprovação é feita pelo Prisma Studio (muda `ProductRevision.status`/`Product.status`).
- Avaliações (não há model `Review`).
- Cupons e descontos.
- Bundles e patches MIDI (existem no enum `ProductType`, mas não entram na UI agora).
- Baixo e violão (o banco é multi-instrumento; a UI fixa `instrument = GUITAR`).

## Anti-objetivos (seria falha mesmo funcionando)

- Guardar dado bancário ou documento do vendedor no nosso banco (só `stripeAccountId`).
- Exigir conta Stripe para criar ou publicar produto.
- Produto aparecer na loja sem passar por análise.
- Arquivo pago acessível sem compra (link público do R2 para `DELIVERABLE`).
- Valores monetários em `Float`/`Decimal` ou regra comercial hardcoded fora de `sellerEarnings.ts`.

## Regras de negócio (confirmadas)

Centralizadas em `src/components/seller/sellerEarnings.ts` (`SELLER_RULES`):
comissão 15% · retenção de 30 dias após cada venda · reembolso em 7 dias · Fundador 0% nas 10 primeiras vendas até 90 dias após o lançamento · preço mínimo R$ 10 · taxa Stripe estimada 3,99% + R$ 0,39.

## Telas

Todas dentro de um layout `(seller)/seller/layout.tsx` com barra lateral (noite) e conteúdo (creme). Guard: exige sessão e `SellerProfile`; sem perfil, redireciona para "Virar vendedor".

### 1. Virar vendedor (`/seller/onboarding`)
- Nome de vendedor (como aparece nos produtos), bio curta e foto (reaproveita o avatar da conta). É o que aparece em "Quem criou este pack".
- Cria `SellerProfile` (com `slug` interno gerado do nome) e marca o usuário como vendedor. Sem pedido de banco.
- Fundador: se o Programa estiver aberto, o perfil nasce com `isFounder = true`.

### 2. Painel (`/seller`)
- Saudação e atalho "Novo produto".
- Faixa "Falta um passo para começar a vender" enquanto `stripeAccountStatus ≠ VERIFIED`, com "Conectar recebimento".
- **Vendedor novo** (sem produtos): checklist de 3 passos — perfil de vendedor, primeiro produto, recebimento — com o próximo passo em destaque.
- **Vendedor ativo**: resumo do **mês atual** (vendas, recebido líquido, saldo retido, disponível); card do Programa Fundador (vendas isentas usadas de 10 e dias restantes, a partir de `founderWaivedSalesCount`); gráfico de vendas do mês; as últimas vendas com o link "Ver todas as vendas" (tela 3).
- O "mês atual" é calculado no fuso de Brasília: no dia 1º o painel passa a mostrar o mês novo sozinho, sem ação do vendedor.
- Antes do checkout existir, os números aparecem zerados.

### 3. Vendas (`/seller/sales`) — decisão do usuário
Tela própria só para os detalhes das vendas, como "Meus produtos" é para os produtos.
- **Seletor de mês** fácil de usar: setas "mês anterior / próximo" e uma lista com todos os meses desde a primeira venda. Abre no **mês atual**; o mês fica na URL (`?mes=2026-11`), então dá para voltar ou compartilhar o link.
- **Resumo do mês escolhido**: número de vendas, valor bruto, comissão, taxas, reembolsos e líquido; comparação com o mês anterior.
- **Gráfico** de vendas por dia do mês.
- **Lista de vendas do mês**: data e hora, produto, valor, comissão ("Isenta" no Fundador), taxa, líquido e situação (retida até a data de liberação, disponível, reembolsada). Filtro por produto.
- **Por produto**: quanto cada produto vendeu no mês (quantidade e líquido).
- Mês sem vendas mostra estado vazio com o seletor ativo.
- Não mostra dados do comprador (só o número do pedido).

### 4. Meus produtos (`/seller/products`)
- Filtros por situação com contagem: Todos, Publicados, Em análise, Rascunhos, Precisam de ajuste (recusados).
- Busca por nome.
- Cada linha: capa, nome, tipo · pedaleira · firmware, preço, vendas (só publicados), situação e ação certa (Editar / Ver envio / Continuar / Corrigir; "Ver página do produto" se publicado).
- Recusado mostra `rejectionReason`.
- Estado vazio por filtro.

### 5. Novo / editar produto (`/seller/products/new`, `/seller/products/[id]/edit`)
Formulário em **5 etapas** (decisão do usuário, para a página não ficar longa): 1 Informações · 2 Classificação · 3 Arquivos e links · 4 Preço · 5 Revisar e enviar. Barra de etapas no topo (clicável, mostra "Concluída / Falta algo / A fazer"), botões Voltar / Salvar rascunho / Continuar no rodapé, prévia do card e checklist fixos ao lado. Tudo é salvo como rascunho ao avançar.

**Regra (decisão do usuário): nenhuma lista pode impedir o vendedor de publicar.** Toda escolha tem a saída "não está aqui" (`Outro` ou "Adicionar como novo"), e o que ele escrever é aproveitado:
- o texto aparece no produto na hora e entra na busca da loja;
- vira uma **sugestão** numa fila de revisão (com quem sugeriu e quantas vezes foi sugerida); o admin promove a opção oficial, que passa a valer nos filtros e na lista de todos;
- sugestões equivalentes são unidas por forma normalizada ("HX Stomp" = "hx stomp" = "Helix Stomp" após revisão);
- na etapa 5, o vendedor vê quais itens novos sugeriu.

Conteúdo das etapas (versão final do canvas, v58):
- **1. Informações**: O que é (múltipla escolha: Preset, IR, Capture, Outro com texto); nome; descrição curta (até 120 caracteres, vai no card); "Sobre o pack"; "O que vem no pack" (lista editável).
- **2. Classificação**:
  - *Estilo (opcional)*: até 3, lista fixa + Outro com texto.
  - *Se Capture*: amplificador capturado (texto) e o que foi capturado (só o amplificador, amplificador com caixa, pedal, Outro com texto).
  - Removidos a pedido do usuário: "Onde funciona", "No estilo de", "Palavras-chave" e os detalhes de IR.
- **3. Arquivos e links** (upload direto ao R2 por URL assinada):
  - Arquivos do pack (`DELIVERABLE`): privados, só para quem comprou; até 200 MB cada.
  - Prévia em áudio (`PREVIEW_AUDIO`): **opcional e sem limite de duração** (decisão do usuário), pública, com player.
  - Capa (`COVER_IMAGE`): opcional, 16:10; sem capa, usa o degradê padrão do card.
  - Link do YouTube: opcional.
  - Removido a pedido do usuário: versão do firmware ou do plugin.
- **4. Preço**: em reais, mínimo R$ 10, ou "Produto gratuito" (sem comissão nem taxa). Ao lado, a conta por venda: preço − comissão − taxa = você recebe; para Fundador com vendas isentas restantes, mostra também o valor sem comissão.
- **5. Revisar e enviar**: resumo de tudo com "Editar" que volta à etapa; aviso dos itens novos sugeridos ("Outro"). Removida a pedido do usuário: a declaração de autoria.
- Ações: "Salvar rascunho" (sempre) e "Enviar para análise" (só com o checklist completo: tipo, nome e descrição; pelo menos um arquivo do pack; preço válido ou gratuito).
- Coluna lateral: prévia ao vivo do card como aparece na loja + checklist do que falta.
- Editar um produto publicado cria uma nova revisão; a versão no ar continua até a nova ser aprovada.

### 6. Carteira (`/seller/wallet`)
- Disponível para saque (sem botão de saque: o usuário o tirou até decidir entre saque manual e automático), retido, recebido desde o início.
- Próximas liberações por data (cada venda libera 30 dias depois, via `OrderItem.availableAt`).
- Extrato filtrável (tudo, vendas, reembolsos, saques): data, movimento, valor, comissão ("Isenta" no Fundador), taxa, líquido, situação.
- Card da conta de recebimento: status vindo da Stripe e link "Gerenciar na Stripe" (dados bancários nunca passam pelo Amplifica).

### 7. Recebimentos (`/seller/payouts` ou dentro da Carteira)
- Iniciar onboarding do Stripe Connect (conta hospedada), voltar do fluxo e mostrar status (`NOT_STARTED`, `PENDING`, `VERIFIED`, `RESTRICTED`) com o que falta.
- O tipo de conta (pessoa física ou CNPJ) é escolhido dentro do onboarding da Stripe.

### 8. Perfil do vendedor (`/seller/profile`)
O que o comprador vê em "Quem criou este pack", na página de cada produto. Acessível pela barra lateral e pelo cartão com o nome do vendedor no topo dela.
- Foto (a mesma da conta), nome de vendedor (até 40 caracteres), "Sobre você" (até 400), cidade (opcional).
- Equipamento que usa: pedaleiras marcadas como chips (mesma lista oficial de pedaleiras).
- Redes sociais opcionais: Instagram, YouTube, TikTok, Spotify (viram ícones no bloco do vendedor).
- Prévia ao vivo do bloco "Quem criou este pack" ao lado; "Salvar alterações" com confirmação.
- Dados de recebimento não ficam aqui (ficam na Stripe, em Recebimentos).
- Schema: `SellerProfile` já tem nome, bio e avatar; faltam cidade, equipamentos e redes sociais (entram na mesma migration).

## Escopo da primeira implementação (decisão do usuário, 2026-11-10)

Todas as telas, desktop e celular, lendo e gravando no banco: virar vendedor, painel, vendas, meus produtos, novo/editar produto (rascunho, envio para análise, upload ao R2), carteira e perfil. Ficam para depois: onboarding do Stripe Connect (Recebimentos mostra só o status), fila de sugestões do admin e o catálogo de pedaleiras. No celular, a barra lateral vira cabeçalho com logo + "Amplifica" e menu hambúrguer à direita; não há botão "+" no cabeçalho.

## Fluxo de um produto

`DRAFT` → (Enviar para análise) → `PENDING_REVIEW` → aprovado: `PUBLISHED` (revisão vira `liveRevision`) · recusado: `REJECTED` com motivo → vendedor corrige e reenvia.
Um produto `PUBLISHED` só pode ser **comprado** se o vendedor tiver `stripeAccountStatus = VERIFIED`; sem isso a página mostra o produto mas não vende (comportamento da loja, a decidir na fase de checkout).
Vendedor pode arquivar (`ARCHIVED`): sai da loja, quem comprou mantém o acesso.

## O que o schema já cobre

`SellerProfile` (slug, nome, bio, avatar, `stripeAccountId`, `stripeAccountStatus`, `isFounder`, `founderWaivedSalesCount`), `Product` (tipo, compatibilidade, status, preço em centavos, título, descrição, `liveRevision`), `ProductRevision` (versão, status, motivo de recusa, revisor), `ProductFile` (tipo do arquivo, `r2Key`, tamanho), `OrderItem` (`availableAt`, `transferredAt`) e `Refund`.

## O que falta no schema (migration nova)

- Firmware usado (texto, por revisão).
- Descrição curta (card) separada do "Sobre o pack" (hoje há só `description`).
- "O que vem no pack" (lista de texto; coluna `String[]` ou Json validado por Zod).
- Link do YouTube (opcional, por revisão).
- Declaração de autoria aceita (data/hora, por revisão), para registro.
- Classificação por tags: tipos (vários por produto, em vez do `productType` único), equipamentos, estilos, "no estilo de", palavras-chave, gabinete, microfone, amplificador e tipo de captura. Proposta: `Tag` ganha `group` (tipo, equipamento, estilo, artista, palavra-chave, gabinete, microfone), `status` (`OFFICIAL` / `SUGGESTED`), `normalized` (para unir duplicadas) e quem sugeriu; `Product` ↔ `Tag` já é muitos-para-muitos.
- Fila de sugestões no admin (aprovar como oficial, unir com uma existente ou recusar).
- Enum `Device` × pedaleiras da loja: a loja filtra por Line 6, Kemper, Boss, Fractal, Mooer, Valeton, M-Vave e Zoom; o enum tem `KEMPER`, `LINE6_HELIX`, `QUAD_CORTEX`, `TONEX`, `NEURAL_DSP_PLUGIN`, `FRACTAL`, `BOSS`, `HEADRUSH`, `UNIVERSAL_IR`, `OTHER` — não tem Mooer, Valeton, M-Vave nem Zoom. Precisa alinhar.

## Arquitetura (segue `.claude/rules/architecture.md`)

- Rotas em `src/app/(seller)/seller/*`, só composição.
- Escritas em `src/actions/sellerActions.ts` e `productActions.ts` (Zod → service → `ActionResult`).
- Leituras em `src/server/queries/sellerQueries.ts`, `productQueries.ts`, `metricsQueries.ts`.
- Regras em `src/server/services/` (ex.: transição de status da revisão; cálculo de carteira em `walletService.ts`).
- Schemas Zod em `src/schemas/productSchema.ts` (compartilhado entre formulário e action).
- Upload: action gera URL assinada do R2 (`src/lib/r2.ts`); o navegador envia direto; a action registra o `ProductFile`.
- UI com shadcn (form, select, textarea, tabs, table, dialog) no visual v4; textos em `src/messages/{pt-BR,en}/ui.json`.

## Decidido por mim (confirmar)

- Limites: pack até 200 MB; prévia de 30 a 60 segundos (mp3/wav).
- Toda edição de produto publicado volta para análise.
- Produto gratuito é permitido.
- Vendedor recebe e-mail quando a análise termina (Resend, já usado no projeto).
- Barra lateral: Painel, Vendas, Produtos, Carteira, Perfil, Recebimentos.

## Perguntas em aberto (do usuário)

1. **Saque**: o vendedor clica em "Sacar" quando quiser, ou o dinheiro liberado cai sozinho na conta (payout automático da Stripe)?
2. **Pedaleiras**: a lista oficial é a da loja (Line 6, Kemper, Boss, Fractal, Mooer, Valeton, M-Vave, Zoom), a do banco, ou a união das duas?
3. **Programa Fundador**: todo vendedor que entra antes do lançamento é Fundador automaticamente, ou existe limite de vagas / convite?
4. **Análise**: quem aprova no começo é só você (pelo Prisma Studio)?
