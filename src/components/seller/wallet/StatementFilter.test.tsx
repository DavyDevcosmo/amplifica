import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { StatementFilter } from './StatementFilter'

describe('StatementFilter', () => {
  test('quatro pílulas em grupo nomeado, com links ?filtro=', () => {
    renderWithIntl(<StatementFilter current="all" />)
    const group = screen.getByRole('group', { name: 'Filtrar extrato' })
    const links = within(group).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Tudo',
      'Vendas',
      'Reembolsos',
      'Transferências',
    ])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/seller/wallet',
      '/seller/wallet?filtro=sales',
      '/seller/wallet?filtro=refunds',
      '/seller/wallet?filtro=transfers',
    ])
  })

  test('só a pílula atual tem aria-current', () => {
    renderWithIntl(<StatementFilter current="refunds" />)
    expect(screen.getByRole('link', { name: 'Reembolsos' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('link', { name: 'Tudo' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
