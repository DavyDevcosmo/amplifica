import { describe, expect, test } from 'vitest'
import type { SaleItem } from './salesReport'
import { buildStatement, upcomingReleases, walletSummary } from './walletService'

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

describe('walletSummary', () => {
  test('separa disponível, retido, recebido e transferido', () => {
    const w = walletSummary(
      [
        item({ availableAt: new Date('2026-12-09T12:00Z') }),
        item({ availableAt: new Date('2026-11-01T12:00Z') }),
        item({
          availableAt: new Date('2026-10-01T12:00Z'),
          transferredAt: new Date('2026-10-02T12:00Z'),
        }),
        item({ status: 'REFUNDED' }),
      ],
      now,
    )
    expect(w).toEqual({
      availableCents: 5463,
      heldCents: 5463,
      heldCount: 1,
      nextReleaseAt: new Date('2026-12-09T12:00Z'),
      receivedCents: 3 * 5463,
      transferredCents: 5463,
    })
  })

  test('nextReleaseAt é a menor liberação entre os retidos; sem itens zera tudo', () => {
    const w = walletSummary(
      [
        item({ availableAt: new Date('2026-12-20T12:00Z') }),
        item({ availableAt: new Date('2026-11-25T12:00Z') }),
      ],
      now,
    )
    expect(w.nextReleaseAt).toEqual(new Date('2026-11-25T12:00Z'))
    expect(w.heldCount).toBe(2)
    expect(walletSummary([], now)).toEqual({
      availableCents: 0,
      heldCents: 0,
      heldCount: 0,
      nextReleaseAt: null,
      receivedCents: 0,
      transferredCents: 0,
    })
  })
})

describe('upcomingReleases', () => {
  const held = [
    item({ id: 'a', availableAt: new Date('2026-12-09T12:00Z') }),
    item({ id: 'b', availableAt: new Date('2026-12-09T20:00Z') }),
    item({ id: 'c', availableAt: new Date('2026-11-20T12:00Z') }),
  ]

  test('agrupa por dia de Brasília, em ordem crescente', () => {
    expect(upcomingReleases(held, now)).toEqual([
      {
        dayKey: '2026-11-20',
        date: new Date('2026-11-20T12:00Z'),
        amountCents: 5463,
        count: 1,
      },
      {
        dayKey: '2026-12-09',
        date: new Date('2026-12-09T12:00Z'),
        amountCents: 2 * 5463,
        count: 2,
      },
    ])
  })

  test('respeita o limite e ignora disponíveis e reembolsados', () => {
    const items = [
      ...held,
      item({ availableAt: new Date('2026-11-01T12:00Z') }),
      item({ status: 'REFUNDED', availableAt: new Date('2026-12-30T12:00Z') }),
    ]
    expect(upcomingReleases(items, now, 1).map((r) => r.dayKey)).toEqual(['2026-11-20'])
    expect(upcomingReleases(items, now)).toHaveLength(2)
  })

  test('liberação às 23h em Brasília conta no dia de Brasília, não no UTC', () => {
    const [release] = upcomingReleases(
      [item({ availableAt: new Date('2026-12-10T02:00Z') })],
      now,
    )
    expect(release.dayKey).toBe('2026-12-09')
  })
})

describe('buildStatement', () => {
  const items = [
    item({
      id: 'sold',
      createdAt: new Date('2026-11-08T12:00Z'),
      availableAt: new Date('2026-12-08T12:00Z'),
    }),
    item({
      id: 'refunded',
      status: 'REFUNDED',
      createdAt: new Date('2026-11-03T12:00Z'),
      refund: {
        amountCents: 6792,
        status: 'SUCCEEDED',
        processedAt: new Date('2026-11-06T12:00Z'),
      },
    }),
    item({
      id: 'paidOut',
      platformFeeCents: 0,
      createdAt: new Date('2026-09-01T12:00Z'),
      availableAt: new Date('2026-10-01T12:00Z'),
      transferredAt: new Date('2026-10-03T12:00Z'),
    }),
    item({
      id: 'paidOut2',
      createdAt: new Date('2026-09-02T12:00Z'),
      availableAt: new Date('2026-10-02T12:00Z'),
      transferredAt: new Date('2026-10-03T18:00Z'),
    }),
  ]

  test('gera venda, reembolso e uma transferência por dia, em ordem de data decrescente', () => {
    const rows = buildStatement(items, now)
    expect(rows.map((r) => [r.kind, r.id])).toEqual([
      ['sale', 'sale-sold'],
      ['refund', 'refund-refunded'],
      ['sale', 'sale-refunded'],
      ['transfer', 'transfer-2026-10-03'],
      ['sale', 'sale-paidOut2'],
      ['sale', 'sale-paidOut'],
    ])
  })

  test('linha de venda traz a quebra e o estado', () => {
    const rows = buildStatement(items, now)
    expect(rows.find((r) => r.id === 'sale-sold')).toMatchObject({
      title: 'Preset Crunch',
      grossCents: 6792,
      commissionCents: 1019,
      processingCents: 310,
      netCents: 5463,
      state: 'held',
      exempt: false,
    })
    expect(rows.find((r) => r.id === 'sale-refunded')?.state).toBe('refunded')
    expect(rows.find((r) => r.id === 'sale-paidOut')).toMatchObject({
      state: 'transferred',
      exempt: true,
      netCents: 6482,
    })
  })

  test('reembolso tem valores negativos e usa a data de processamento', () => {
    const refund = buildStatement(items, now).find((r) => r.kind === 'refund')
    expect(refund).toMatchObject({
      date: new Date('2026-11-06T12:00Z'),
      grossCents: -6792,
      commissionCents: null,
      processingCents: null,
      netCents: -5463,
      state: 'refunded',
    })
  })

  test('transferência soma os líquidos do dia como valor negativo', () => {
    const transfer = buildStatement(items, now).find((r) => r.kind === 'transfer')
    expect(transfer).toMatchObject({
      title: 'Transferência para sua conta Stripe',
      grossCents: -(6482 + 5463),
      netCents: -(6482 + 5463),
      commissionCents: null,
      processingCents: null,
      state: 'transferred',
    })
  })

  test('reembolso pendente ou falho não gera linha de reembolso', () => {
    const rows = buildStatement(
      [
        item({
          status: 'REFUNDED',
          refund: { amountCents: 6792, status: 'PENDING', processedAt: null },
        }),
        item({
          id: 'x',
          status: 'REFUNDED',
          refund: { amountCents: 6792, status: 'FAILED', processedAt: null },
        }),
      ],
      now,
    )
    expect(rows.map((r) => r.kind)).toEqual(['sale', 'sale'])
  })
})
