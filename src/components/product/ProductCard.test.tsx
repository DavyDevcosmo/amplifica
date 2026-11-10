import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductCardData } from '@/components/product/sampleProducts'
import { renderWithIntl } from '@/test/renderWithIntl'

const PAID: ProductCardData = {
  slug: 'plexi-68-helix',
  device: 'LINE 6 HELIX',
  brand: 'LINE 6',
  kind: 'PRESET',
  title: 'Plexi 68 — Helix',
  description: 'Plexi com a cadeia completa de palco.',
  priceCents: 6792,
  compareAtCents: 7990,
  founder: true,
}

// O Intl põe um espaço especial (não separável) entre "R$" e o valor.
const brl = (value: string) => new RegExp(`^R\\$\\s${value}$`)

describe('ProductCard', () => {
  test('mostra preço, preço riscado, desconto e selo de fundador', () => {
    renderWithIntl(<ProductCard product={PAID} />)

    expect(screen.getByText(brl('67,92'))).toBeInTheDocument()
    expect(screen.getByText(brl('79,90'))).toBeInTheDocument()
    expect(screen.getByText('-15%')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Vendedor fundador' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Comprar Plexi 68 — Helix' }),
    ).toHaveAttribute('href', '/products/plexi-68-helix')
  })

  test('produto grátis vira "Baixar"', () => {
    renderWithIntl(
      <ProductCard
        product={{ ...PAID, priceCents: 0, compareAtCents: undefined, founder: false }}
      />,
    )

    expect(screen.getByText('Grátis')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Baixar Plexi 68 — Helix' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Vendedor fundador' }),
    ).not.toBeInTheDocument()
  })

  test('o botão de prévia alterna entre ouvir e pausar', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ProductCard product={PAID} />)

    const play = screen.getByRole('button', {
      name: 'Ouvir prévia de Plexi 68 — Helix',
    })
    expect(play).toHaveAttribute('aria-pressed', 'false')

    await user.click(play)

    expect(
      screen.getByRole('button', { name: 'Pausar prévia de Plexi 68 — Helix' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
