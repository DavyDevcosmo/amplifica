export const SEED_PASSWORD = 'senha123'
export const PLATFORM_COMMISSION_BPS = 1500
export const HOLD_DAYS = 30

export const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000)
export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000)
/** `HOLD_DAYS` a partir de uma data-base (ex.: `paidAt`), não de "agora" —
 * evita recalcular o offset em dias à mão em cada order item do seed. */
export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

/** Divide um preço (em centavos) entre plataforma e vendedor pela comissão em bps. */
export function splitCommission(priceCents: number, commissionBps: number) {
  const platformFeeCents = Math.round((priceCents * commissionBps) / 10_000)
  return { platformFeeCents, sellerAmountCents: priceCents - platformFeeCents }
}
