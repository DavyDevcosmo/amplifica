import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { DayPoint } from '@/server/services/salesReport'
import { renderWithIntl } from '@/test/renderWithIntl'
import { MonthBars } from './MonthBars'

function day(n: number, count: number, future = false): DayPoint {
  return {
    day: n,
    future,
    byProduct: count ? [{ productId: 'p', count, netCents: count * 100 }] : [],
  }
}

describe('MonthBars', () => {
  test('desenha uma barra por dia até hoje e descreve o pico', () => {
    const points = [day(1, 0), day(2, 3), day(3, 1), day(4, 0, true)]
    renderWithIntl(<MonthBars points={points} month="novembro" startLabel="1 nov" />)
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute(
      'aria-label',
      'Gráfico de vendas por dia em novembro até hoje, com pico de 3 vendas',
    )
    expect(chart.children).toHaveLength(3)
    expect(screen.getByText('4 vendas')).toBeInTheDocument()
    expect(screen.getByText('1 nov')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
  })

  test('sem vendas, descreve o mês vazio e mostra zero vendas', () => {
    renderWithIntl(
      <MonthBars points={[day(1, 0), day(2, 0)]} month="novembro" startLabel="1 nov" />,
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Gráfico de vendas por dia em novembro até hoje, sem vendas',
    )
    expect(screen.getByText('0 vendas')).toBeInTheDocument()
  })
})
