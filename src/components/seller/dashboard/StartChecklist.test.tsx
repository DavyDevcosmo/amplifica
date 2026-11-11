import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { StartChecklist } from './StartChecklist'

describe('StartChecklist', () => {
  test('checklist marca o perfil feito e destaca o próximo passo', () => {
    renderWithIntl(
      <StartChecklist profileDone productDone={false} receivingDone={false} />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Feito')).toBeInTheDocument()
    expect(within(items[0]).queryByRole('link')).toBeNull()
    expect(
      within(items[1]).getByRole('link', { name: 'Novo produto' }),
    ).toHaveAttribute('href', '/seller/products/new')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[2]).not.toHaveAttribute('aria-current')
    expect(within(items[2]).getByRole('link', { name: 'Conectar' })).toHaveAttribute(
      'href',
      '/seller/payouts',
    )
  })

  test('sem nada feito, o primeiro passo é o atual e leva ao perfil', () => {
    renderWithIntl(
      <StartChecklist profileDone={false} productDone={false} receivingDone={false} />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(
      within(items[0]).getByRole('link', { name: 'Editar perfil' }),
    ).toHaveAttribute('href', '/seller/profile')
  })
})
