import { describe, expect, test } from 'vitest'
import {
  estimateProcessingCents,
  parseBrlToCents,
  SELLER_RULES,
  saleBreakdown,
  simulateMonthlyEarnings,
} from './sellerEarnings'

describe('simulateMonthlyEarnings', () => {
  test('sem Fundador: 15% de comissão e processamento em toda venda', () => {
    const result = simulateMonthlyEarnings({
      priceCents: 4900,
      sales: 20,
      founder: false,
    })

    expect(result.grossCents).toBe(98_000)
    expect(result.exemptSales).toBe(0)
    // 15% de R$ 49,00 = R$ 7,35 por venda
    expect(result.commissionCents).toBe(735 * 20)
    // 3,99% de R$ 49,00 = R$ 1,96 (arredondado) + R$ 0,39 por venda
    expect(result.processingCents).toBe((196 + 39) * 20)
    expect(result.netCents).toBe(98_000 - 14_700 - 4_700)
  })

  test('Fundador: as 10 primeiras vendas não pagam comissão', () => {
    const result = simulateMonthlyEarnings({
      priceCents: 4900,
      sales: 20,
      founder: true,
    })

    expect(result.exemptSales).toBe(SELLER_RULES.founderFreeSales)
    expect(result.commissionCents).toBe(735 * 10)
  })

  test('Fundador com menos de 10 vendas: comissão zero', () => {
    const result = simulateMonthlyEarnings({
      priceCents: 1000,
      sales: 3,
      founder: true,
    })

    expect(result.exemptSales).toBe(3)
    expect(result.commissionCents).toBe(0)
  })

  test('valores são sempre centavos inteiros', () => {
    const result = simulateMonthlyEarnings({
      priceCents: 1999,
      sales: 7,
      founder: false,
    })

    for (const value of Object.values(result)) {
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('estimateProcessingCents', () => {
  test('3,99% + R$ 0,39, ou 0 para produto gratuito', () => {
    expect(estimateProcessingCents(6792)).toBe(310) // 271 + 39
    expect(estimateProcessingCents(0)).toBe(0)
  })
})

describe('saleBreakdown', () => {
  test('com comissão e isenta', () => {
    expect(saleBreakdown({ priceCents: 6792, platformFeeCents: 1019 })).toEqual({
      grossCents: 6792,
      commissionCents: 1019,
      processingCents: 310,
      netCents: 5463,
      exempt: false,
    })
    expect(saleBreakdown({ priceCents: 6792, platformFeeCents: 0 }).exempt).toBe(true)
    expect(saleBreakdown({ priceCents: 0, platformFeeCents: 0 }).exempt).toBe(false)
  })

  test('líquido nunca fica negativo', () => {
    expect(saleBreakdown({ priceCents: 100, platformFeeCents: 100 }).netCents).toBe(0)
  })
})

describe('parseBrlToCents', () => {
  test.each([
    ['67,92', 6792],
    ['1.234,50', 123450],
    ['10', 1000],
    ['9,99', 999],
    [',5', 50],
    [' 12,3 ', 1230],
    ['', null],
    ['abc', null],
    ['12,345', null],
    ['-5', null],
  ])('parseBrlToCents(%s)', (input, cents) => {
    expect(parseBrlToCents(input)).toBe(cents)
  })
})
