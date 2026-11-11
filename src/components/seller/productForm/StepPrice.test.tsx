import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { StepPrice } from './StepPrice'

describe('StepPrice', () => {
  test('StepPrice calcula o líquido e bloqueia abaixo de R$ 10', async () => {
    const onChange = vi.fn()
    renderWithIntl(
      <StepPrice
        priceCents={6792}
        free={false}
        founderRemainingSales={3}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('R$ 54,63')).toBeInTheDocument() // 6792 − 1019 − 310
    expect(
      screen.getByText(/nas suas 3 vendas isentas restantes você recebe R\$ 64,82/),
    ).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Preço de venda'))
    await userEvent.type(screen.getByLabelText('Preço de venda'), '9,99')
    expect(screen.getByLabelText('Preço de venda')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByText('O preço mínimo é R$ 10,00.')).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith({ priceCents: 999, free: false })
  })

  test('preço acima do teto e texto inválido têm mensagens próprias', async () => {
    renderWithIntl(
      <StepPrice
        priceCents={6792}
        free={false}
        founderRemainingSales={0}
        onChange={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Preço de venda')
    await userEvent.clear(input)
    await userEvent.type(input, '100.000,01')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('O preço máximo é R$ 100.000,00.')).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, '12abc')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Digite um valor como 49,90.')).toBeInTheDocument()
    expect(screen.queryByText('O preço mínimo é R$ 10,00.')).not.toBeInTheDocument()
  })

  test('mostra a ajuda com preço válido e mostra comissão e taxa', () => {
    renderWithIntl(
      <StepPrice
        priceCents={6792}
        free={false}
        founderRemainingSales={0}
        onChange={vi.fn()}
      />,
    )
    expect(
      screen.getByText('Mínimo de R$ 10,00. Você pode mudar depois.'),
    ).toBeInTheDocument()
    expect(screen.getByText('− R$ 10,19')).toBeInTheDocument()
    expect(screen.getByText('− R$ 3,10')).toBeInTheDocument()
    expect(screen.queryByText(/vendedor fundador/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Preço de venda')).toHaveAttribute(
      'inputmode',
      'decimal',
    )
  })

  test('produto gratuito desabilita o campo e esconde a nota de fundador', async () => {
    const onChange = vi.fn()
    const first = renderWithIntl(
      <StepPrice
        priceCents={6792}
        free={false}
        founderRemainingSales={3}
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('switch', { name: 'Produto gratuito' }))
    expect(onChange).toHaveBeenLastCalledWith({ priceCents: 6792, free: true })
    first.unmount()

    renderWithIntl(
      <StepPrice
        priceCents={6792}
        free
        founderRemainingSales={3}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('Preço de venda')).toBeDisabled()
    expect(
      screen.getByText('Produtos gratuitos não pagam comissão nem taxa.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/vendedor fundador/)).not.toBeInTheDocument()
  })
})
