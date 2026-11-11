export const WALLET_FILTERS = ['all', 'sales', 'refunds', 'transfers'] as const
export type WalletFilter = (typeof WALLET_FILTERS)[number]

export const STATEMENT_LIMIT = 50

type Kind = 'sale' | 'refund' | 'transfer'

const KIND_BY_FILTER: Record<Exclude<WalletFilter, 'all'>, Kind> = {
  sales: 'sale',
  refunds: 'refund',
  transfers: 'transfer',
}

// ?filtro= vindo da URL: desconhecido, vazio ou repetido (string[]) vira 'all'.
export function parseWalletFilter(raw: string | string[] | undefined): WalletFilter {
  if (typeof raw !== 'string') return 'all'
  return (WALLET_FILTERS as readonly string[]).includes(raw)
    ? (raw as WalletFilter)
    : 'all'
}

// Linhas já vêm da mais recente para a mais antiga; mantém as 50 primeiras.
export function filterStatement<Row extends { kind: Kind }>(
  rows: Row[],
  filter: WalletFilter,
): Row[] {
  const kept =
    filter === 'all' ? rows : rows.filter((row) => row.kind === KIND_BY_FILTER[filter])
  return kept.slice(0, STATEMENT_LIMIT)
}
