import { describe, expect, test } from 'vitest'
import { getInitials, safeCallbackUrl } from './utils'

describe('getInitials', () => {
  test('usa as duas primeiras palavras em maiúsculas', () => {
    expect(getInitials('Maria Souza Lima')).toBe('MS')
    expect(getInitials('maria souza')).toBe('MS')
  })

  test('aceita nome de uma palavra e espaços sobrando', () => {
    expect(getInitials('Maria')).toBe('M')
    expect(getInitials('  Maria   Souza ')).toBe('MS')
  })

  test('vazio vira string vazia', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('safeCallbackUrl', () => {
  test('aceita caminho relativo normal', () => {
    expect(safeCallbackUrl('/account/profile')).toBe('/account/profile')
    expect(safeCallbackUrl('/checkout?step=2')).toBe('/checkout?step=2')
  })

  test('vira "/" quando vazio ou ausente', () => {
    expect(safeCallbackUrl(undefined)).toBe('/')
    expect(safeCallbackUrl(null)).toBe('/')
    expect(safeCallbackUrl('')).toBe('/')
  })

  test('bloqueia protocolo relativo disfarçado (open redirect)', () => {
    expect(safeCallbackUrl('//evil.com')).toBe('/')
    expect(safeCallbackUrl('/\\evil.com')).toBe('/')
  })

  test('bloqueia bypass com caractere de controle (tab/CR/LF) antes do "//"', () => {
    expect(safeCallbackUrl('/\t/evil.com')).toBe('/')
    expect(safeCallbackUrl('/\n/evil.com')).toBe('/')
    expect(safeCallbackUrl('/\r/evil.com')).toBe('/')
  })

  test('bloqueia URL absoluta', () => {
    expect(safeCallbackUrl('https://evil.com')).toBe('/')
    expect(safeCallbackUrl('http://evil.com/account')).toBe('/')
  })

  test('bloqueia caminho que não começa com "/"', () => {
    expect(safeCallbackUrl('account/profile')).toBe('/')
  })
})
