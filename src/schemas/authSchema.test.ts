import { describe, expect, test } from 'vitest'
import {
  forgotPasswordSchema,
  otpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './authSchema'

describe('signUpSchema', () => {
  test('aceita dados válidos', () => {
    const result = signUpSchema.safeParse({
      name: 'Guitarrista',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
  })

  test('rejeita quando as senhas não coincidem', () => {
    const result = signUpSchema.safeParse({
      name: 'Guitarrista',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'outrasenha',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })

  test('rejeita senha curta', () => {
    const result = signUpSchema.safeParse({
      name: 'Guitarrista',
      email: 'guitarrista@example.com',
      password: '123',
      confirmPassword: '123',
    })
    expect(result.success).toBe(false)
  })

  test('rejeita e-mail inválido', () => {
    const result = signUpSchema.safeParse({
      name: 'Guitarrista',
      email: 'não-é-email',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
  })
})

describe('signInSchema', () => {
  test('exige e-mail válido e senha não vazia', () => {
    expect(signInSchema.safeParse({ email: 'a@a.com', password: '' }).success).toBe(
      false,
    )
    expect(signInSchema.safeParse({ email: 'invalido', password: 'x' }).success).toBe(
      false,
    )
    expect(signInSchema.safeParse({ email: 'a@a.com', password: 'x' }).success).toBe(
      true,
    )
  })
})

describe('otpSchema', () => {
  test('só aceita 6 dígitos', () => {
    expect(otpSchema.safeParse({ email: 'a@a.com', otp: '123456' }).success).toBe(true)
    expect(otpSchema.safeParse({ email: 'a@a.com', otp: '12345' }).success).toBe(false)
    expect(otpSchema.safeParse({ email: 'a@a.com', otp: 'abcdef' }).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  test('exige e-mail válido', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@a.com' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'invalido' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  test('rejeita quando as senhas não coincidem', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'senha1234',
      confirmPassword: 'diferente',
    })
    expect(result.success).toBe(false)
  })
})
