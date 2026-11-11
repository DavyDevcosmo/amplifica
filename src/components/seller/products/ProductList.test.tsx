import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { SellerProductRow } from '@/server/queries/productQueries'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ProductList } from './ProductList'

function row(overrides: Partial<SellerProductRow> = {}): SellerProductRow {
  return {
    id: 'p1',
    title: 'Plexi 68 — Helix',
    kinds: ['PRESET'],
    kindOther: null,
    capturedAmp: null,
    priceCents: 6792,
    salesCount: 41,
    status: 'published',
    rejectionReason: null,
    coverUrl: null,
    updatedAt: new Date('2026-11-01T12:00:00Z'),
    ...overrides,
  }
}

describe('ProductList', () => {
  test('linha recusada mostra motivo e ação Corrigir', () => {
    renderWithIntl(
      <ProductList
        products={[
          row({ status: 'rejected', rejectionReason: 'a prévia corta antes do fim.' }),
        ]}
      />,
    )
    expect(screen.getByText('Motivo: a prévia corta antes do fim.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Corrigir' })).toHaveAttribute(
      'href',
      '/seller/products/p1/edit',
    )
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Precisa de ajuste')).toBeInTheDocument()
  })

  test('produto publicado mostra preço, vendas, selo e Editar, sem "Ver página"', () => {
    renderWithIntl(<ProductList products={[row()]} />)
    expect(screen.getByText('Plexi 68 — Helix')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*67,92/)).toBeInTheDocument()
    expect(screen.getByText('41')).toBeInTheDocument()
    expect(screen.getByText('Publicado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/seller/products/p1/edit',
    )
    expect(screen.queryByText(/Ver página/)).not.toBeInTheDocument()
  })

  test.each([
    ['review', 'Em análise', 'Ver envio'],
    ['draft', 'Rascunho', 'Continuar'],
  ] as const)('situação %s mostra selo e ação', (status, badge, action) => {
    renderWithIntl(<ProductList products={[row({ status, salesCount: 0 })]} />)
    expect(screen.getByText(badge)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: action })).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  test('preço zero vira Grátis', () => {
    renderWithIntl(<ProductList products={[row({ priceCents: 0 })]} />)
    expect(screen.getByText('Grátis')).toBeInTheDocument()
  })

  test('meta junta os tipos com " + ", usa o texto de "Outro" e o amp capturado', () => {
    renderWithIntl(
      <ProductList
        products={[
          row({
            kinds: ['PRESET', 'IR', 'CAPTURE', 'OTHER'],
            kindOther: 'Patch MIDI',
            capturedAmp: 'Plexi 1959',
          }),
        ]}
      />,
    )
    expect(
      screen.getByText('Preset + IR + Capture + Patch MIDI · Plexi 1959'),
    ).toBeInTheDocument()
  })

  test('capa sem imagem mostra a sigla do primeiro tipo; com imagem usa a URL', () => {
    const { container } = renderWithIntl(
      <ProductList
        products={[
          row({ id: 'a', kinds: ['PRESET'] }),
          row({ id: 'b', kinds: ['CAPTURE'], coverUrl: 'https://cdn.test/c.jpg' }),
        ]}
      />,
    )
    expect(screen.getByText('PST')).toBeInTheDocument()
    expect(screen.queryByText('CAP')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.test/c.jpg',
    )
  })

  test('uma linha por produto, dentro de uma região nomeada', () => {
    renderWithIntl(
      <ProductList products={[row({ id: 'a' }), row({ id: 'b', title: 'JCM 800' })]} />,
    )
    const region = screen.getByRole('region', { name: 'Lista de produtos' })
    expect(within(region).getAllByRole('listitem')).toHaveLength(2)
  })

  test('filtro sem resultado mostra "Nada por aqui"', () => {
    renderWithIntl(<ProductList products={[]} />)
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Nenhum produto nessa situação. Os outros filtros mostram o resto.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Novo produto' })).not.toBeInTheDocument()
  })

  test('sem nenhum produto oferece o botão Novo produto', () => {
    renderWithIntl(<ProductList products={[]} hasAny={false} />)
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Novo produto' })).toHaveAttribute(
      'href',
      '/seller/products/new',
    )
  })
})
