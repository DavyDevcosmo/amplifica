import { SELLER_RULES } from '@/components/seller/sellerEarnings'

const DAY_MS = 24 * 60 * 60 * 1000

export type FounderStatus = {
  used: number
  total: number
  remainingSales: number
  // null quando o início do programa não está configurado
  daysLeft: number | null
}

// Situação do Programa Fundador de um vendedor: vendas isentas usadas e dias
// que faltam para a janela fechar. Puro: quem chama passa o "agora".
export function founderStatus(
  seller: { isFounder: boolean; founderWaivedSalesCount: number },
  now: Date,
  startsAt?: Date,
): FounderStatus {
  const total = SELLER_RULES.founderFreeSales
  const used = Math.min(Math.max(seller.founderWaivedSalesCount, 0), total)
  const endsAt = startsAt
    ? startsAt.getTime() + SELLER_RULES.founderWindowDays * DAY_MS
    : null
  return {
    used,
    total,
    remainingSales: total - used,
    daysLeft:
      endsAt === null
        ? null
        : Math.max(0, Math.ceil((endsAt - now.getTime()) / DAY_MS)),
  }
}
