import { describe, expect, test } from 'vitest'
import {
  avatarUploadSchema,
  changePasswordSchema,
  confirmAvatarSchema,
  updateProfileSchema,
} from './userSchema'

describe('updateProfileSchema', () => {
  test('aceita nome válido', () => {
    expect(updateProfileSchema.safeParse({ name: 'Guitarrista' }).success).toBe(true)
  })

  test('rejeita nome muito curto', () => {
    expect(updateProfileSchema.safeParse({ name: 'A' }).success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  test('aceita quando as senhas coincidem', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'senhaAtual',
      newPassword: 'senhaNova123',
      confirmNewPassword: 'senhaNova123',
    })
    expect(result.success).toBe(true)
  })

  test('rejeita quando as senhas não coincidem', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'senhaAtual',
      newPassword: 'senhaNova123',
      confirmNewPassword: 'outraSenha',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmNewPassword'])
    }
  })

  test('rejeita senha nova curta', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'senhaAtual',
      newPassword: '123',
      confirmNewPassword: '123',
    })
    expect(result.success).toBe(false)
  })
})

describe('avatarUploadSchema', () => {
  test('aceita tipo e tamanho válidos', () => {
    const result = avatarUploadSchema.safeParse({
      contentType: 'image/png',
      size: 1024,
    })
    expect(result.success).toBe(true)
  })

  test('rejeita tipo não suportado', () => {
    const result = avatarUploadSchema.safeParse({
      contentType: 'image/gif',
      size: 1024,
    })
    expect(result.success).toBe(false)
  })

  test('rejeita tamanho acima do limite de 2 MB', () => {
    const result = avatarUploadSchema.safeParse({
      contentType: 'image/png',
      size: 2 * 1024 * 1024 + 1,
    })
    expect(result.success).toBe(false)
  })
})

describe('confirmAvatarSchema', () => {
  test('rejeita key vazia', () => {
    expect(confirmAvatarSchema.safeParse({ key: '' }).success).toBe(false)
  })
})
