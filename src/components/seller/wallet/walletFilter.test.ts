import { describe, expect, test } from 'vitest'
import { filterStatement, parseWalletFilter } from './walletFilter'

describe('parseWalletFilter', () => {
  test('aceita os quatro valores', () => {
    for (const value of ['all', 'sales', 'refunds', 'transfers']) {
      expect(parseWalletFilter(value)).toBe(value)
    }
  })

  test('valor desconhecido, vazio, ausente ou repetido cai em all', () => {
    expect(parseWalletFilter('xyz')).toBe('all')
    expect(parseWalletFilter('')).toBe('all')
    expect(parseWalletFilter(undefined)).toBe('all')
    expect(parseWalletFilter(['sales', 'refunds'])).toBe('all')
    expect(parseWalletFilter('toString')).toBe('all')
  })
})

describe('filterStatement', () => {
  const rows = [
    { id: 'a', kind: 'sale' as const },
    { id: 'b', kind: 'refund' as const },
    { id: 'c', kind: 'transfer' as const },
    { id: 'd', kind: 'sale' as const },
  ]

  test('filtra por tipo', () => {
    expect(filterStatement(rows, 'all').map((r) => r.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(filterStatement(rows, 'sales').map((r) => r.id)).toEqual(['a', 'd'])
    expect(filterStatement(rows, 'refunds').map((r) => r.id)).toEqual(['b'])
    expect(filterStatement(rows, 'transfers').map((r) => r.id)).toEqual(['c'])
  })

  test('limita às 50 linhas mais recentes', () => {
    const many = Array.from({ length: 70 }, (_, i) => ({
      id: String(i),
      kind: 'sale' as const,
    }))
    const result = filterStatement(many, 'all')
    expect(result).toHaveLength(50)
    expect(result[0].id).toBe('0')
  })
})
