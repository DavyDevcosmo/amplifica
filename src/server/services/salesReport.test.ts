import { describe, expect, test } from 'vitest'
import {
  dailySeries,
  itemState,
  orderLabel,
  type SaleItem,
  saleStatus,
  summarizeMonth,
  totalsByProduct,
} from './salesReport'

const now = new Date('2026-11-10T15:00Z')

function item(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    id: 'i1',
    orderId: 'clx0000000000abc123',
    productId: 'p1',
    productTitle: 'Preset Crunch',
    priceCents: 6792,
    platformFeeCents: 1019,
    status: 'PAID',
    createdAt: new Date('2026-11-02T12:00Z'),
    availableAt: new Date('2026-12-02T12:00Z'),
    transferredAt: null,
    refund: null,
    ...overrides,
  }
}

describe('itemState', () => {
  test('retido, disponível e reembolsado', () => {
    expect(
      itemState(item({ availableAt: new Date('2026-12-09T12:00Z') }), now),
    ).toEqual({ kind: 'held', until: new Date('2026-12-09T12:00Z') })
    expect(
      itemState(item({ availableAt: new Date('2026-11-01T12:00Z') }), now),
    ).toEqual({ kind: 'available' })
    expect(itemState(item({ status: 'REFUNDED' }), now)).toEqual({ kind: 'refunded' })
  })

  test('liberando exatamente agora já está disponível', () => {
    expect(itemState(item({ availableAt: now }), now)).toEqual({ kind: 'available' })
  })
})

describe('orderLabel', () => {
  test('usa os 6 últimos caracteres em maiúsculas, sem identificar o comprador', () => {
    expect(orderLabel('clx0000000000abc123')).toBe('#ABC123')
  })
})

describe('summarizeMonth', () => {
  test('separa reembolsos do líquido', () => {
    const s = summarizeMonth([
      item(),
      item({ platformFeeCents: 0 }),
      item({ status: 'REFUNDED', priceCents: 3490 }),
    ])
    expect(s).toMatchObject({
      salesCount: 2,
      grossCents: 13584,
      commissionCents: 1019,
      refundsCents: 3490,
      refundsCount: 1,
      netCents: 5463 + 6482,
    })
    expect(s.processingCents).toBe(620)
  })

  test('mês vazio zera tudo', () => {
    expect(summarizeMonth([])).toEqual({
      salesCount: 0,
      grossCents: 0,
      commissionCents: 0,
      processingCents: 0,
      refundsCents: 0,
      refundsCount: 0,
      netCents: 0,
    })
  })
})

describe('dailySeries', () => {
  test('marca dias futuros e agrupa por produto', () => {
    const points = dailySeries(
      [
        item({ createdAt: new Date('2026-11-05T13:00Z'), productId: 'a' }),
        item({ createdAt: new Date('2026-11-05T14:00Z'), productId: 'a' }),
      ],
      '2026-11',
      now,
    )
    expect(points).toHaveLength(30)
    expect(points[4].day).toBe(5)
    expect(points[4].byProduct).toEqual([
      { productId: 'a', count: 2, netCents: 2 * 5463 },
    ])
    expect(points[10].future).toBe(true)
    expect(points[9].future).toBe(false)
  })

  test('venda às 23h30 de 30/11 em Brasília cai no dia 30 de novembro', () => {
    const points = dailySeries(
      [item({ createdAt: new Date('2026-12-01T02:30Z') })],
      '2026-11',
      new Date('2026-12-05T12:00Z'),
    )
    expect(points[29].byProduct).toHaveLength(1)
    expect(points.every((p) => !p.future)).toBe(true)
  })

  test('ignora itens reembolsados e de outros meses; mês passado não tem futuro', () => {
    const points = dailySeries(
      [
        item({ status: 'REFUNDED' }),
        item({ createdAt: new Date('2026-10-20T12:00Z') }),
      ],
      '2026-11',
      new Date('2026-12-05T12:00Z'),
    )
    expect(points.flatMap((p) => p.byProduct)).toEqual([])
    expect(points.some((p) => p.future)).toBe(false)
  })

  test('mês posterior ao atual fica todo no futuro', () => {
    const points = dailySeries([], '2026-12', now)
    expect(points).toHaveLength(31)
    expect(points.every((p) => p.future)).toBe(true)
  })
})

describe('totalsByProduct', () => {
  test('soma por produto, ordenado por líquido decrescente, sem reembolsados', () => {
    const totals = totalsByProduct([
      item({ productId: 'a', productTitle: 'A' }),
      item({
        productId: 'b',
        productTitle: 'B',
        priceCents: 10000,
        platformFeeCents: 1500,
      }),
      item({ productId: 'a', productTitle: 'A' }),
      item({ productId: 'c', productTitle: 'C', status: 'REFUNDED' }),
    ])
    // B: 10000 - 1500 - (round(399) + 39 = 438) = 8062
    expect(totals).toEqual([
      { productId: 'a', title: 'A', count: 2, netCents: 2 * 5463 },
      { productId: 'b', title: 'B', count: 1, netCents: 8062 },
    ])
  })
})

describe('saleStatus', () => {
  test('item pago e já enviado à Stripe vira transferred', () => {
    const transferred = item({ transferredAt: new Date('2026-11-05T12:00Z') })
    expect(saleStatus(transferred, now)).toBe('transferred')
  })

  test('sem transferência segue o estado do item', () => {
    expect(saleStatus(item(), now)).toEqual({
      kind: 'held',
      until: new Date('2026-12-02T12:00Z'),
    })
    expect(saleStatus(item({ status: 'REFUNDED' }), now)).toEqual({ kind: 'refunded' })
  })

  test('reembolsado nunca aparece como transferido', () => {
    const refunded = item({
      status: 'REFUNDED',
      transferredAt: new Date('2026-11-05T12:00Z'),
    })
    expect(saleStatus(refunded, now)).toEqual({ kind: 'refunded' })
  })
})
