import { APIError } from 'better-auth/api'
import { createTranslator } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'
import errors from '@/messages/pt-BR/errors.json'
import { authFailure, invalidInputFailure } from './authErrors'

// getTranslations('errors') real, só que síncrono e com as mensagens pt-BR.
vi.mock('next-intl/server', () => ({
  getTranslations: async () =>
    createTranslator({ locale: 'pt-BR', messages: { errors }, namespace: 'errors' }),
}))

describe('authFailure', () => {
  test('traduz o código conhecido e devolve o code', async () => {
    const result = await authFailure(
      new APIError('BAD_REQUEST', { code: 'OTP_EXPIRED', message: 'x' }),
    )
    expect(result).toEqual({
      success: false,
      error: 'Código expirado. Peça um novo.',
      code: 'OTP_EXPIRED',
    })
  })

  test('LOGIN_LOCKED traz os minutos como parâmetro', async () => {
    const result = await authFailure(
      new APIError('TOO_MANY_REQUESTS', {
        code: 'LOGIN_LOCKED',
        message: 'texto interno',
        minutes: 5,
      }),
    )
    expect(result).toEqual({
      success: false,
      error: 'Muitas tentativas. Tente novamente em 5 min.',
      code: 'LOGIN_LOCKED',
      params: { minutes: 5 },
    })
  })

  test('código desconhecido não vaza a mensagem interna', async () => {
    const result = await authFailure(
      new APIError('BAD_REQUEST', { code: 'ALGO_NOVO', message: 'segredo interno' }),
    )
    expect(result).toEqual({
      success: false,
      error: 'Não foi possível completar a ação. Tente novamente.',
    })
  })

  test('erro que não é APIError cai na mensagem genérica', async () => {
    const result = await authFailure(new Error('boom'))
    expect(result.success).toBe(false)
  })
})

describe('invalidInputFailure', () => {
  test('traduz a chave do schema', async () => {
    expect(await invalidInputFailure('emailInvalid')).toEqual({
      success: false,
      error: 'Digite um e-mail válido.',
    })
  })

  test('chave inexistente cai em "Dados inválidos"', async () => {
    expect(await invalidInputFailure('Invalid input')).toEqual({
      success: false,
      error: 'Dados inválidos',
    })
  })
})
