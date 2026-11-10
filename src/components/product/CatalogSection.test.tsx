import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { CatalogSection } from '@/components/product/CatalogSection'
import type { ProductCardData } from '@/components/product/sampleProducts'
import { renderWithIntl } from '@/test/renderWithIntl'

const PRODUCTS: ProductCardData[] = [
  {
    slug: 'plexi',
    device: 'LINE 6 HELIX',
    brand: 'LINE 6',
    kind: 'PRESET',
    title: 'Plexi 68',
    description: 'Plexi de palco.',
    priceCents: 6792,
  },
  {
    slug: 'clean',
    device: 'KEMPER',
    brand: 'KEMPER',
    kind: 'CAPTURE',
    title: 'Clean americano',
    description: 'Combo limpo.',
    priceCents: 3990,
  },
]

function renderCatalog() {
  return renderWithIntl(
    <CatalogSection products={PRODUCTS} brands={['LINE 6', 'KEMPER', 'ZOOM']} />,
  )
}

describe('CatalogSection', () => {
  test('começa com todas as pedaleiras selecionadas', () => {
    renderCatalog()

    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Explore os presets' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  test('filtrar por pedaleira mostra só os produtos dela', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(screen.getByRole('button', { name: 'KEMPER' }))

    expect(screen.getByRole('button', { name: 'KEMPER' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Presets para KEMPER' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clean americano' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Plexi 68' })).not.toBeInTheDocument()
  })

  test('pedaleira sem produto mostra o estado vazio e volta pra todas', async () => {
    const user = userEvent.setup()
    renderCatalog()

    await user.click(screen.getByRole('button', { name: 'ZOOM' }))
    expect(screen.getByText('Nada para ZOOM ainda')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver todas as pedaleiras' }))
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
})
