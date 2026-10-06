import { describe, expect, test } from 'vitest'
import { isSignupExpired } from './pendingSignupService'

const MINUTE = 60 * 1000

describe('isSignupExpired', () => {
  test('não expirou logo após a criação', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const createdAt = new Date(now.getTime() - 1 * MINUTE)
    expect(isSignupExpired(createdAt, now)).toBe(false)
  })

  test('não expirou exatamente nos 30 min', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const createdAt = new Date(now.getTime() - 30 * MINUTE)
    expect(isSignupExpired(createdAt, now)).toBe(false)
  })

  test('expirou passado de 30 min', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const createdAt = new Date(now.getTime() - 31 * MINUTE)
    expect(isSignupExpired(createdAt, now)).toBe(true)
  })
})
