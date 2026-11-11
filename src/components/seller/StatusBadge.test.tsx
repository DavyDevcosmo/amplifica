import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { renderWithIntl } from '@/test/renderWithIntl'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  test('retida mostra o dia da liberação em Brasília', () => {
    renderWithIntl(
      <StatusBadge state={{ kind: 'held', until: new Date('2026-12-09T14:00:00Z') }} />,
    )
    expect(screen.getByText('Retida até 9 dez')).toBeInTheDocument()
  })

  test.each([
    [{ kind: 'available' as const }, 'Disponível'],
    [{ kind: 'refunded' as const }, 'Reembolsada'],
    ['transferred' as const, 'Transferida'],
  ])('rótulo de %j', (state, label) => {
    renderWithIntl(<StatusBadge state={state} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
