import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { SellerMobileHeader } from './SellerMobileHeader'

vi.mock('next/navigation', () => ({
  usePathname: () => '/seller',
}))

describe('SellerMobileHeader', () => {
  test('hambúrguer abre e fecha o menu do vendedor', async () => {
    renderWithIntl(<SellerMobileHeader />)
    const button = screen.getByRole('button', { name: 'Abrir menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: 'Área do vendedor' })).toBeNull()

    await userEvent.click(button)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const nav = screen.getByRole('navigation', { name: 'Área do vendedor' })
    expect(within(nav).getByRole('link', { name: 'Meus produtos' })).toHaveAttribute(
      'href',
      '/seller/products',
    )

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Área do vendedor' })).toBeNull()
  })

  test('marca a página atual e oferece o caminho de volta para a loja', async () => {
    renderWithIntl(<SellerMobileHeader />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    const nav = screen.getByRole('navigation', { name: 'Área do vendedor' })
    expect(within(nav).getByRole('link', { name: 'Painel' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Vendas' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(
      within(nav).getByRole('link', { name: 'Voltar para a loja' }),
    ).toHaveAttribute('href', '/')
  })
})
