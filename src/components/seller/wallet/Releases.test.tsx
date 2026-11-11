import { screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { type ReleaseRow, Releases } from './Releases'

const fourReleases: ReleaseRow[] = [
  {
    dayKey: '2026-12-07',
    date: new Date('2026-12-07T15:00:00Z'),
    amountCents: 3792,
    count: 1,
  },
  {
    dayKey: '2026-12-09',
    date: new Date('2026-12-09T15:00:00Z'),
    amountCents: 12964,
    count: 2,
  },
  {
    dayKey: '2026-12-10',
    date: new Date('2026-12-10T15:00:00Z'),
    amountCents: 5712,
    count: 1,
  },
  {
    dayKey: '2026-12-12',
    date: new Date('2026-12-12T15:00:00Z'),
    amountCents: 11812,
    count: 1,
  },
]

describe('Releases', () => {
  test('mostra até 4 e esconde o 4º no celular por CSS', () => {
    renderWithIntl(<Releases releases={fourReleases} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[3].className).toMatch(/max-md:/)
    expect(within(items[1]).getByText('2 vendas')).toBeInTheDocument()
  })

  test('cada item mostra data, valor e contagem no singular', () => {
    renderWithIntl(<Releases releases={fourReleases} />)
    const first = screen.getAllByRole('listitem')[0]
    expect(first).toHaveTextContent('7 dez')
    expect(first).toHaveTextContent(/R\$\s?37,92/)
    expect(within(first).getByText('1 venda')).toBeInTheDocument()
  })

  test('sem liberações mostra o estado vazio e nenhuma lista', () => {
    renderWithIntl(<Releases releases={[]} />)
    expect(screen.getByText('Nenhum valor retido agora.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
