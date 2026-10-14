import { describe, expect, test } from 'vitest'
import {
  avatarUploadSchema,
  changePasswordFormSchema,
  changePasswordSchema,
  confirmAvatarSchema,
  setPasswordFormSchema,
  setPasswordSchema,
  updateProfileSchema,
} from './userSchema'

function firstIssue(result: { success: boolean; error?: { issues: unknown[] } }) {
  return result.error?.issues[0] as { path: unknown[]; message: string } | undefined
}

describe('updateProfileSchema', () => {
  test('aceita nome e sobrenome', () => {
    expect(updateProfileSchema.safeParse({ name: 'Maria Souza' }).success).toBe(true)
  })

  test('rejeita nome muito curto', () => {
    const result = updateProfileSchema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.message).toBe('nameTooShort')
  })

  test('rejeita nome de uma palavra só', () => {
    const result = updateProfileSchema.safeParse({ name: 'Maria' })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.message).toBe('nameNeedsSurname')
  })

  test('ignora espaços nas pontas ao contar as palavras', () => {
    expect(updateProfileSchema.safeParse({ name: '  Maria  ' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ name: '  Maria  Souza ' }).success).toBe(
      true,
    )
  })
})

describe('changePasswordFormSchema', () => {
  const valid = {
    currentPassword: 'senhaAtual',
    newPassword: 'senhaNova123',
    confirmNewPassword: 'senhaNova123',
  }

  test('aceita quando tudo confere', () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true)
  })

  test('rejeita quando as senhas não coincidem', () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      confirmNewPassword: 'outraSenha',
    })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.path).toEqual(['confirmNewPassword'])
  })

  test('rejeita senha nova curta', () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      newPassword: '123',
      confirmNewPassword: '123',
    })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.message).toBe('passwordTooShort')
  })

  test('rejeita senha nova igual à atual', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'senhaAtual1',
      newPassword: 'senhaAtual1',
      confirmNewPassword: 'senhaAtual1',
    })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.message).toBe('passwordSameAsCurrent')
    expect(firstIssue(result)?.path).toEqual(['newPassword'])
  })

  test('exige a senha atual', () => {
    const result = changePasswordFormSchema.safeParse({ ...valid, currentPassword: '' })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.message).toBe('currentPasswordRequired')
  })
})

describe('changePasswordSchema (o que a action recebe)', () => {
  test('não exige a confirmação', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'senhaAtual',
      newPassword: 'senhaNova123',
    })
    expect(result.success).toBe(true)
  })

  test('rejeita senha nova igual à atual', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'senhaIgual1',
      newPassword: 'senhaIgual1',
    })
    expect(result.success).toBe(false)
  })
})

describe('setPasswordSchema / setPasswordFormSchema', () => {
  test('aceita só a nova senha na action', () => {
    expect(setPasswordSchema.safeParse({ newPassword: 'senhaNova123' }).success).toBe(
      true,
    )
  })

  test('rejeita senha curta', () => {
    expect(setPasswordSchema.safeParse({ newPassword: '123' }).success).toBe(false)
  })

  test('o form exige a confirmação igual', () => {
    const result = setPasswordFormSchema.safeParse({
      newPassword: 'senhaNova123',
      confirmNewPassword: 'outraSenha',
    })
    expect(result.success).toBe(false)
    expect(firstIssue(result)?.path).toEqual(['confirmNewPassword'])
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
