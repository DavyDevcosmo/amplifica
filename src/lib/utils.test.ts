import { describe, expect, test } from 'vitest'
import { safeCallbackUrl } from './utils'

describe('safeCallbackUrl', () => {
  test('aceita caminho relativo normal', () => {
    expect(safeCallbackUrl('/conta/perfil')).toBe('/conta/perfil')
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
    expect(safeCallbackUrl('http://evil.com/conta')).toBe('/')
  })

  test('bloqueia caminho que não começa com "/"', () => {
    expect(safeCallbackUrl('conta/perfil')).toBe('/')
  })
})
