import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { BalanceCards, type BalanceSummary } from './BalanceCards'

function summary(overrides: Partial<BalanceSummary> = {}): BalanceSummary {
  return {
    availableCents: 14340,
    heldCents: 34280,
    heldCount: 5,
    nextReleaseAt: new Date('2026-12-07T15:00:00Z'),
    receivedCents: 241860,
    transferredCents: 193240,
    ...overrides,
  }
}

describe('BalanceCards', () => {
  test('três cartões com os valores e as notas', () => {
    renderWithIntl(<BalanceCards summary={summary()} />)
    const available = screen.getByRole('region', { name: 'Disponível para saque' })
    expect(available).toHaveTextContent(/R\$\s?143,40/)
    expect(available).toHaveTextContent('Vai para a conta cadastrada na Stripe.')
    const held = screen.getByRole('region', { name: 'Retido' })
    expect(held).toHaveTextContent(/R\$\s?342,80/)
    expect(held).toHaveTextContent(
      '5 vendas aguardando os 30 dias. A próxima libera em 7 de dezembro.',
    )
    const received = screen.getByRole('region', { name: 'Recebido desde o início' })
    expect(received).toHaveTextContent(/R\$\s?2\.418,60/)
    expect(received).toHaveTextContent(/Já transferido: R\$\s?1\.932,40\./)
  })

  test('não tem botão de saque', () => {
    renderWithIntl(<BalanceCards summary={summary()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('sem vendas: zeros e nota de retido sem data', () => {
    renderWithIntl(
      <BalanceCards
        summary={summary({
          availableCents: 0,
          heldCents: 0,
          heldCount: 0,
          nextReleaseAt: null,
          receivedCents: 0,
          transferredCents: 0,
        })}
      />,
    )
    const held = screen.getByRole('region', { name: 'Retido' })
    expect(held).toHaveTextContent('Nenhuma venda aguardando os 30 dias.')
    expect(held).not.toHaveTextContent('A próxima libera')
    expect(within(held).getByText(/R\$\s?0,00/)).toBeInTheDocument()
  })

  test('singular: 1 venda', () => {
    renderWithIntl(<BalanceCards summary={summary({ heldCount: 1 })} />)
    expect(screen.getByRole('region', { name: 'Retido' })).toHaveTextContent(
      '1 venda aguardando os 30 dias.',
    )
  })
})
