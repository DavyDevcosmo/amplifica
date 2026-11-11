import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ProductFilter } from './ProductFilter'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const options = [
  { id: 'a', title: 'Plexi 68 — Helix' },
  { id: 'b', title: 'JCM 800 — Helix' },
]

describe('ProductFilter', () => {
  beforeEach(() => push.mockClear())

  test('filtra por produto preservando o mês', async () => {
    renderWithIntl(<ProductFilter month="2026-10" options={options} value="all" />)
    const select = screen.getByRole('combobox', { name: 'Produto' })
    expect(select).toHaveValue('all')
    await userEvent.selectOptions(select, 'b')
    expect(push).toHaveBeenCalledWith('?mes=2026-10&produto=b')
  })

  test('voltar para Todos remove o produto da URL', async () => {
    renderWithIntl(<ProductFilter month="2026-10" options={options} value="b" />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Produto' }),
      'all',
    )
    expect(push).toHaveBeenCalledWith('?mes=2026-10')
  })
})
