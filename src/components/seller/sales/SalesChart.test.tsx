import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { SalesChart, type SalesChartDay } from './SalesChart'

const products = [
  { id: 'a', title: 'Plexi 68 — Helix', color: '#2563eb' },
  { id: 'b', title: 'JCM 800 — Helix', color: '#1c3352' },
]

// 10/11: dias 1 a 10 já chegaram; do 11 em diante é futuro.
const fixtureDays: SalesChartDay[] = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  future: index + 1 > 10,
  byProduct: [],
}))
fixtureDays[2] = {
  day: 3,
  future: false,
  byProduct: [{ productId: 'b', count: 1, netCents: 4500 }],
}
fixtureDays[4] = {
  day: 5,
  future: false,
  byProduct: [
    { productId: 'a', count: 2, netCents: 10926 },
    { productId: 'b', count: 1, netCents: 4500 },
  ],
}

function renderChart() {
  return renderWithIntl(
    <SalesChart days={fixtureDays} products={products} monthLabel="novembro" />,
  )
}

describe('SalesChart', () => {
  test('troca a métrica e anuncia o dia focado', async () => {
    renderChart()
    await userEvent.click(screen.getByRole('button', { name: 'Dia 5: 3 vendas' }))
    expect(screen.getByRole('status')).toHaveTextContent('Dia 5 de novembro')
    expect(screen.getByRole('status')).toHaveTextContent('Plexi 68 — Helix: 2 vendas')

    await userEvent.click(screen.getByRole('button', { name: 'Você recebe' }))
    expect(screen.getByRole('button', { name: 'Você recebe' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Quantidade' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.getByRole('button', { name: /Dia 5: R\$\s?154,26/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /Plexi 68 — Helix: R\$\s?109,26/,
    )
    expect(
      screen.getByRole('button', { name: 'Dia 12: ainda não chegou' }),
    ).toBeDisabled()
  })

  test('foca por padrão o dia de maior valor', () => {
    renderChart()
    expect(screen.getByRole('status')).toHaveTextContent('Dia 5 de novembro')
  })

  test('singular, zero e futuro nos rótulos dos dias', () => {
    renderChart()
    expect(screen.getByRole('button', { name: 'Dia 3: 1 venda' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Dia 1: 0 vendas' })).toBeEnabled()
  })

  test('eixo Y com 5 marcas e legenda de totais por produto', () => {
    renderChart()
    const legend = screen.getByRole('list', { name: 'Totais por produto no mês' })
    const items = within(legend).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Plexi 68 — Helix')
    expect(items[0]).toHaveTextContent('2 vendas')
    expect(items[1]).toHaveTextContent('JCM 800 — Helix')
    expect(items[1]).toHaveTextContent('2 vendas')
    expect(screen.getByTestId('y-axis').children).toHaveLength(5)
  })

  test('dia sem venda mostra a mensagem de vazio', async () => {
    renderChart()
    await userEvent.click(screen.getByRole('button', { name: 'Dia 1: 0 vendas' }))
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma venda neste dia')
  })
})
