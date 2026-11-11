import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { SalesTable, type SalesTableRow } from './SalesTable'

function row(overrides: Partial<SalesTableRow> = {}): SalesTableRow {
  return {
    id: 'i1',
    createdAt: new Date('2026-11-10T17:32:00Z'),
    order: '#ABC123',
    title: 'Plexi 68 — Helix',
    priceCents: 6792,
    commissionCents: 1019,
    exempt: false,
    processingCents: 310,
    netCents: 5463,
    state: { kind: 'available' },
    ...overrides,
  }
}

function firstRowCells() {
  return within(screen.getAllByRole('row')[1]).getAllByRole('cell')
}

describe('SalesTable', () => {
  test('região rolável acessível com as colunas do extrato', () => {
    renderWithIntl(<SalesTable rows={[row()]} />)
    const region = screen.getByRole('region', { name: 'Tabela de vendas do mês' })
    expect(region).toHaveAttribute('tabindex', '0')
    for (const name of [
      'Data',
      'Pedido',
      'Produto',
      'Valor',
      'Comissão',
      'Taxa',
      'Você recebe',
      'Situação',
    ]) {
      expect(within(region).getByRole('columnheader', { name })).toBeInTheDocument()
    }
  })

  test('linha de venda mostra data, hora, valores e situação', () => {
    renderWithIntl(<SalesTable rows={[row()]} />)
    const cells = firstRowCells()
    expect(cells[0]).toHaveTextContent('10 nov')
    expect(cells[0]).toHaveTextContent('14:32')
    expect(cells[1]).toHaveTextContent('#ABC123')
    expect(cells[2]).toHaveTextContent('Plexi 68 — Helix')
    expect(cells[3]).toHaveTextContent(/R\$\s?67,92/)
    expect(cells[4]).toHaveTextContent(/− R\$\s?10,19/)
    expect(cells[5]).toHaveTextContent(/− R\$\s?3,10/)
    expect(cells[6]).toHaveTextContent(/^R\$\s?54,63$/)
    expect(cells[7]).toHaveTextContent('Disponível')
  })

  test('comissão isenta (Fundador) mostra Isenta', () => {
    renderWithIntl(
      <SalesTable rows={[row({ commissionCents: 0, exempt: true, netCents: 6482 })]} />,
    )
    expect(firstRowCells()[4]).toHaveTextContent('Isenta')
  })

  test('venda reembolsada mostra o líquido negativo em vermelho', () => {
    renderWithIntl(<SalesTable rows={[row({ state: { kind: 'refunded' } })]} />)
    const cells = firstRowCells()
    expect(cells[6]).toHaveTextContent(/^− R\$\s?54,63$/)
    expect(cells[6].className).toContain('text-destructive-strong')
    expect(cells[7]).toHaveTextContent('Reembolsada')
  })
})
