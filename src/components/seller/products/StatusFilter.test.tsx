import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { StatusFilter } from './StatusFilter'

const counts = { all: 6, published: 3, review: 1, draft: 1, rejected: 1 }

describe('StatusFilter', () => {
  test('grupo nomeado com cinco pílulas e contagens', () => {
    renderWithIntl(<StatusFilter counts={counts} current="all" />)
    const group = screen.getByRole('group', { name: 'Filtrar por situação' })
    const links = within(group).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Todos6',
      'Publicados3',
      'Em análise1',
      'Rascunhos1',
      'Precisam de ajuste1',
    ])
  })

  test('a pílula atual tem aria-current e as demais não', () => {
    renderWithIntl(<StatusFilter counts={counts} current="draft" />)
    expect(screen.getByRole('link', { name: /Rascunhos/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('link', { name: /Todos/ })).not.toHaveAttribute(
      'aria-current',
    )
  })

  test('links vão para ?situacao= e Todos limpa o parâmetro; a busca é mantida', () => {
    renderWithIntl(<StatusFilter counts={counts} current="all" query="clean" />)
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveAttribute(
      'href',
      '/seller/products?q=clean',
    )
    expect(screen.getByRole('link', { name: /Em análise/ })).toHaveAttribute(
      'href',
      '/seller/products?situacao=review&q=clean',
    )
  })

  test('sem busca os links não levam q', () => {
    renderWithIntl(<StatusFilter counts={counts} current="all" />)
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveAttribute(
      'href',
      '/seller/products',
    )
    expect(screen.getByRole('link', { name: /Publicados/ })).toHaveAttribute(
      'href',
      '/seller/products?situacao=published',
    )
  })
})
