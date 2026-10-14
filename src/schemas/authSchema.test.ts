import { describe, expect, test } from 'vitest'
import {
  forgotPasswordSchema,
  newPasswordFormSchema,
  otpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpFormSchema,
  signUpSchema,
} from './authSchema'

describe('signUpFormSchema', () => {
  test('aceita dados válidos', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Guitarrista Teste',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
  })

  test('rejeita quando as senhas não coincidem', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Guitarrista Teste',
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
    const result = signUpFormSchema.safeParse({
      name: 'Guitarrista Teste',
      email: 'guitarrista@example.com',
      password: '123',
      confirmPassword: '123',
    })
    expect(result.success).toBe(false)
  })

  test('rejeita nome vazio', () => {
    const result = signUpFormSchema.safeParse({
      name: '',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((issue) => issue.path[0] === 'name')
      expect(nameIssue?.message).toBe('nameTooShort')
    }
  })

  test('rejeita nome com 1 caractere', () => {
    const result = signUpFormSchema.safeParse({
      name: 'A',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((issue) => issue.path[0] === 'name')
      expect(nameIssue?.message).toBe('nameTooShort')
    }
  })

  test('aceita nome com 3 caracteres e 2 palavras', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Jo S',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
  })

  test('rejeita nome de uma palavra só', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Guitarrista',
      email: 'guitarrista@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((issue) => issue.path[0] === 'name')
      expect(nameIssue?.message).toBe('nameNeedsSurname')
    }
  })

  test('rejeita e-mail inválido', () => {
    const result = signUpFormSchema.safeParse({
      name: 'Guitarrista Teste',
      email: 'não-é-email',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
  })
})

describe('signInSchema', () => {
  test('exige e-mail válido', () => {
    expect(
      signInSchema.safeParse({ email: 'invalido', password: 'senha1234' }).success,
    ).toBe(false)
    expect(
      signInSchema.safeParse({ email: 'a@a.com', password: 'senha1234' }).success,
    ).toBe(true)
  })

  test('exige senha com pelo menos 8 caracteres', () => {
    expect(signInSchema.safeParse({ email: 'a@a.com', password: '' }).success).toBe(
      false,
    )
    const result = signInSchema.safeParse({ email: 'a@a.com', password: 'curta' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('passwordTooShort')
    }
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

describe('newPasswordFormSchema', () => {
  test('rejeita quando as senhas não coincidem', () => {
    const result = newPasswordFormSchema.safeParse({
      password: 'senha1234',
      confirmPassword: 'diferente',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })

  test('rejeita senha curta', () => {
    const result = newPasswordFormSchema.safeParse({
      password: '123',
      confirmPassword: '123',
    })
    expect(result.success).toBe(false)
  })

  test('aceita senhas iguais, sem pedir e-mail nem código', () => {
    const result = newPasswordFormSchema.safeParse({
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
  })
})

describe('resetPasswordSchema', () => {
  test('rejeita código que não tem 6 dígitos', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'user@example.com',
      otp: '12345',
      password: 'senha1234',
    })
    expect(result.success).toBe(false)
  })

  test('aceita e-mail, código de 6 dígitos e senha', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'user@example.com',
      otp: '123456',
      password: 'senha1234',
    })
    expect(result.success).toBe(true)
  })
})

describe('schemas da action (sem confirmPassword)', () => {
  test('signUpSchema descarta confirmPassword em vez de repassá-lo', () => {
    const result = signUpSchema.safeParse({
      name: 'Guitarrista Teste',
      email: 'user@example.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('confirmPassword')
  })

  test('resetPasswordSchema descarta confirmPassword em vez de repassá-lo', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'user@example.com',
      otp: '123456',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('confirmPassword')
  })
})
