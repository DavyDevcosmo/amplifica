import { describe, expect, test } from 'vitest'
import { founderStatus } from './founderStatus'

describe('founderStatus', () => {
  test('conta vendas usadas e dias que faltam', () => {
    expect(
      founderStatus(
        { isFounder: true, founderWaivedSalesCount: 7 },
        new Date('2026-11-10T12:00Z'),
        new Date('2026-10-14T12:00Z'),
      ),
    ).toEqual({ used: 7, total: 10, remainingSales: 3, daysLeft: 63 })
  })

  test('limita ao total e omite os dias sem data de início', () => {
    expect(
      founderStatus(
        { isFounder: true, founderWaivedSalesCount: 12 },
        new Date(),
        undefined,
      ),
    ).toMatchObject({ used: 10, remainingSales: 0, daysLeft: null })
  })

  test('janela encerrada fica em zero dias, nunca negativo', () => {
    expect(
      founderStatus(
        { isFounder: true, founderWaivedSalesCount: 2 },
        new Date('2027-03-01T12:00Z'),
        new Date('2026-10-14T12:00Z'),
      ).daysLeft,
    ).toBe(0)
  })
})
