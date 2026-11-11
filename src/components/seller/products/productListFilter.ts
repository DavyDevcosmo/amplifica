import type { ListStatus } from '@/schemas/productSchema'

// Só o formato que o filtro precisa; `SellerProductRow` encaixa aqui.
type Filterable = { title: string; status: ListStatus }

export type Situacao = ListStatus | 'all'

export const SITUACOES: readonly Situacao[] = [
  'all',
  'published',
  'review',
  'draft',
  'rejected',
]

/** Parâmetro repetido na URL (`?q=a&q=b`) chega como string[]: vale o primeiro. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** `?situacao=` desconhecida ou ausente vira "todos". */
export function parseSituacao(value: string | undefined): Situacao {
  return SITUACOES.find((situacao) => situacao === value) ?? 'all'
}

/** Minúsculas, sem acento e sem espaço nas pontas ("Américano " -> "americano"). */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export function searchProducts<T extends Filterable>(
  products: T[],
  query: string | undefined,
): T[] {
  const needle = normalizeSearch(query ?? '')
  if (!needle) return products
  return products.filter((product) => normalizeSearch(product.title).includes(needle))
}

export function filterProducts<T extends Filterable>(
  products: T[],
  situacao: Situacao,
): T[] {
  return situacao === 'all'
    ? products
    : products.filter((product) => product.status === situacao)
}

export function countByStatus(products: Filterable[]): Record<Situacao, number> {
  const counts: Record<Situacao, number> = {
    all: products.length,
    published: 0,
    review: 0,
    draft: 0,
    rejected: 0,
  }
  for (const product of products) counts[product.status] += 1
  return counts
}
