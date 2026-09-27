import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Page from '../app/page'

test('Page renders the heading', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1, name: 'helloo' })).toBeDefined()
})
