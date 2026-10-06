import { describe, expect, test } from 'vitest'
import { computeLockout } from './loginThrottleService'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

describe('computeLockout', () => {
  test('sem bloqueio abaixo de 5 falhas', () => {
    expect(computeLockout(0)).toBe(0)
    expect(computeLockout(4)).toBe(0)
  })

  test('1 min a partir de 5 falhas', () => {
    expect(computeLockout(5)).toBe(1 * MINUTE)
    expect(computeLockout(7)).toBe(1 * MINUTE)
  })

  test('5 min a partir de 8 falhas', () => {
    expect(computeLockout(8)).toBe(5 * MINUTE)
    expect(computeLockout(9)).toBe(5 * MINUTE)
  })

  test('15 min a partir de 10 falhas', () => {
    expect(computeLockout(10)).toBe(15 * MINUTE)
  })

  test('dobra a cada falha extra depois de 10', () => {
    expect(computeLockout(11)).toBe(30 * MINUTE)
    expect(computeLockout(12)).toBe(60 * MINUTE)
  })

  test('nunca passa do teto de 1h', () => {
    expect(computeLockout(20)).toBe(HOUR)
    expect(computeLockout(100)).toBe(HOUR)
  })
})
