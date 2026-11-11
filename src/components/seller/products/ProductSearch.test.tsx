import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { ProductSearch } from './ProductSearch'

const replace = vi.fn()
let search = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}))

describe('ProductSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    replace.mockClear()
    search = ''
  })
  afterEach(() => vi.useRealTimers())

  test('campo de busca nomeado com o valor inicial', () => {
    renderWithIntl(<ProductSearch defaultValue="clean" />)
    const input = screen.getByRole('searchbox', { name: 'Buscar produto' })
    expect(input).toHaveValue('clean')
    expect(input).toHaveAttribute('placeholder', 'Buscar pelo nome')
  })

  test('não navega ao montar', () => {
    search = 'q=clean'
    renderWithIntl(<ProductSearch defaultValue="clean" />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(replace).not.toHaveBeenCalled()
  })

  test('atualiza ?q= só depois de 300 ms de pausa', () => {
    renderWithIntl(<ProductSearch defaultValue="" />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'cl' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    fireEvent.change(input, { target: { value: 'clean' } })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(replace).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('?q=clean', { scroll: false })
  })

  test('mantém a situação e apaga q quando o campo esvazia', () => {
    search = 'situacao=draft&q=clean'
    renderWithIntl(<ProductSearch defaultValue="clean" />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(replace).toHaveBeenCalledWith('?situacao=draft', { scroll: false })
  })
})
