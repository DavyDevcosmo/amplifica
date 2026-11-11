import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { MonthPicker } from './MonthPicker'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('MonthPicker', () => {
  beforeEach(() => push.mockClear())

  test('desabilita próximo no mês atual e mostra Mês atual fora dele', async () => {
    const { unmount } = renderWithIntl(
      <MonthPicker month="2026-11" months={['2026-10', '2026-11']} current="2026-11" />,
    )
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Mês atual' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(push).toHaveBeenCalledWith('?mes=2026-10')

    unmount()
    renderWithIntl(
      <MonthPicker month="2026-10" months={['2026-10', '2026-11']} current="2026-11" />,
    )
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Mês atual' }))
    expect(push).toHaveBeenLastCalledWith('?mes=2026-11')
  })

  test('lista os meses do mais recente ao mais antigo e navega ao escolher', async () => {
    renderWithIntl(
      <MonthPicker
        month="2026-11"
        months={['2026-09', '2026-10', '2026-11']}
        current="2026-11"
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Mês' })
    expect(select).toHaveValue('2026-11')
    expect(
      Array.from((select as HTMLSelectElement).options).map((o) => o.textContent),
    ).toEqual(['Novembro de 2026', 'Outubro de 2026', 'Setembro de 2026'])

    await userEvent.selectOptions(select, '2026-09')
    expect(push).toHaveBeenCalledWith('?mes=2026-09')
  })

  test('com um único mês, as duas setas ficam desabilitadas', () => {
    renderWithIntl(
      <MonthPicker month="2026-11" months={['2026-11']} current="2026-11" />,
    )
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
  })
})
