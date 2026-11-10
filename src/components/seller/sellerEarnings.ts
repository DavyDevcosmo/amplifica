// Regras comerciais exibidas nas telas de venda (landing /sell, página de
// produto). Confirmadas com o dono do produto em 2026-11-09. Quando o
// walletService/checkoutService existirem, eles devem ler daqui (ou este
// arquivo deve passar a ler deles) — uma fonte só. Não altere sem confirmar.
//
// Tudo em centavos (Int) e pontos-base (1% = 100 bps): nunca Float pra dinheiro.
export const SELLER_RULES = {
  commissionBps: 1500, // 15% por venda
  founderFreeSales: 10, // Fundador: 0% de comissão nas 10 primeiras vendas...
  founderWindowDays: 90, // ...válido até 90 dias após o lançamento
  payoutHoldDays: 30, // saldo libera para saque 30 dias após cada venda
  refundWindowDays: 7, // garantia de reembolso do comprador
  minPriceCents: 1000, // preço mínimo R$ 10 (ou grátis)
  // Estimativa da taxa da Stripe (varia por forma de pagamento; não é do Amplifica).
  processingBps: 399,
  processingFixedCents: 39,
} as const

export const COMMISSION_PERCENT = SELLER_RULES.commissionBps / 100

function applyBps(cents: number, bps: number) {
  return Math.round((cents * bps) / 10_000)
}

export type EarningsSimulation = {
  grossCents: number
  exemptSales: number
  commissionCents: number
  processingCents: number
  netCents: number
}

// Simula um mês de vendas de um produto: bruto, comissão (com isenção de
// Fundador), processamento estimado e o líquido do vendedor.
export function simulateMonthlyEarnings({
  priceCents,
  sales,
  founder,
}: {
  priceCents: number
  sales: number
  founder: boolean
}): EarningsSimulation {
  const grossCents = priceCents * sales
  const exemptSales = founder ? Math.min(sales, SELLER_RULES.founderFreeSales) : 0
  const commissionCents =
    applyBps(priceCents, SELLER_RULES.commissionBps) * (sales - exemptSales)
  const processingCents =
    sales *
    (applyBps(priceCents, SELLER_RULES.processingBps) +
      SELLER_RULES.processingFixedCents)
  const netCents = Math.max(0, grossCents - commissionCents - processingCents)

  return { grossCents, exemptSales, commissionCents, processingCents, netCents }
}
