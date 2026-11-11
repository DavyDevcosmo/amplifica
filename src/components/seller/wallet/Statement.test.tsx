import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { Statement, type StatementTableRow } from './Statement'

function row(overrides: Partial<StatementTableRow> = {}): StatementTableRow {
  return {
    id: 'sale-1',
    date: new Date('2026-11-09T15:00:00Z'),
    kind: 'sale',
    productTitle: 'Plexi 68 — Helix',
    grossCents: 6792,
    commissionCents: 1019,
    processingCents: 310,
    netCents: 5463,
    exempt: false,
    state: { kind: 'available' },
    ...overrides,
  }
}

function cellsOf(index: number) {
  return within(screen.getAllByRole('row')[index]).getAllByRole('cell')
}

describe('Statement', () => {
  test('região rolável acessível com as colunas do extrato', () => {
    renderWithIntl(<Statement rows={[row()]} filtered={false} />)
    const region = screen.getByRole('region', { name: 'Tabela do extrato' })
    expect(region).toHaveAttribute('tabindex', '0')
    for (const name of [
      'Data',
      'Movimento',
      'Valor',
      'Comissão',
      'Taxa',
      'Líquido',
      'Situação',
    ]) {
      expect(within(region).getByRole('columnheader', { name })).toBeInTheDocument()
    }
  })

  test('linha de venda', () => {
    renderWithIntl(<Statement rows={[row()]} filtered={false} />)
    const cells = cellsOf(1)
    expect(cells[0]).toHaveTextContent('9 nov')
    expect(cells[1]).toHaveTextContent('Venda · Plexi 68 — Helix')
    expect(cells[2]).toHaveTextContent(/^R\$\s?67,92$/)
    expect(cells[3]).toHaveTextContent(/^− R\$\s?10,19$/)
    expect(cells[4]).toHaveTextContent(/^− R\$\s?3,10$/)
    expect(cells[5]).toHaveTextContent(/^R\$\s?54,63$/)
    expect(cells[5].className).not.toContain('text-destructive-strong')
    expect(cells[6]).toHaveTextContent('Disponível')
  })

  test('comissão isenta mostra Isenta', () => {
    renderWithIntl(
      <Statement rows={[row({ commissionCents: 0, exempt: true })]} filtered={false} />,
    )
    expect(cellsOf(1)[3]).toHaveTextContent('Isenta')
  })

  test('venda retida mostra até quando', () => {
    renderWithIntl(
      <Statement
        rows={[
          row({ state: { kind: 'held', until: new Date('2026-12-07T15:00:00Z') } }),
        ]}
        filtered={false}
      />,
    )
    expect(cellsOf(1)[6]).toHaveTextContent('Retida até 7 dez')
  })

  test('reembolso: valor e líquido negativos em vermelho, comissão e taxa em travessão', () => {
    renderWithIntl(
      <Statement
        rows={[
          row({
            id: 'refund-1',
            kind: 'refund',
            grossCents: -3490,
            commissionCents: null,
            processingCents: null,
            netCents: -3312,
            state: { kind: 'refunded' },
          }),
        ]}
        filtered={false}
      />,
    )
    const cells = cellsOf(1)
    expect(cells[1]).toHaveTextContent('Reembolso · Plexi 68 — Helix')
    expect(cells[2]).toHaveTextContent(/^− R\$\s?34,90$/)
    expect(cells[3]).toHaveTextContent(/^—$/)
    expect(cells[4]).toHaveTextContent(/^—$/)
    expect(cells[5]).toHaveTextContent(/^− R\$\s?33,12$/)
    expect(cells[5].className).toContain('text-destructive-strong')
    expect(cells[6]).toHaveTextContent('Reembolsada')
  })

  test('transferência usa o texto das mensagens, não o título do serviço', () => {
    renderWithIntl(
      <Statement
        rows={[
          row({
            id: 'transfer-2026-11-05',
            kind: 'transfer',
            productTitle: '',
            grossCents: -193240,
            commissionCents: null,
            processingCents: null,
            netCents: -193240,
            state: 'transferred',
          }),
        ]}
        filtered={false}
      />,
    )
    const cells = cellsOf(1)
    expect(cells[1]).toHaveTextContent('Transferência para sua conta Stripe')
    expect(cells[5]).toHaveTextContent(/^− R\$\s?1\.932,40$/)
    expect(cells[6]).toHaveTextContent('Transferida')
  })

  test('sem linhas: mensagem vazia e nenhuma tabela', () => {
    renderWithIntl(<Statement rows={[]} filtered={false} />)
    expect(screen.getByText(/Nenhum movimento ainda/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('sem linhas com filtro ativo: mensagem do filtro', () => {
    renderWithIntl(<Statement rows={[]} filtered />)
    expect(screen.getByText('Nenhum movimento neste filtro.')).toBeInTheDocument()
  })
})
