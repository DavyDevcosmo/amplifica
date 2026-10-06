import { describe, expect, test } from 'vitest'
import {
  isAllowedContentType,
  isValidAvatarSize,
  MAX_AVATAR_BYTES,
} from './avatarService'

describe('isAllowedContentType', () => {
  test('aceita png, jpeg e webp', () => {
    expect(isAllowedContentType('image/png')).toBe(true)
    expect(isAllowedContentType('image/jpeg')).toBe(true)
    expect(isAllowedContentType('image/webp')).toBe(true)
  })

  test('rejeita qualquer outro tipo', () => {
    expect(isAllowedContentType('image/gif')).toBe(false)
    expect(isAllowedContentType('application/pdf')).toBe(false)
    expect(isAllowedContentType('')).toBe(false)
  })
})

describe('isValidAvatarSize', () => {
  test('aceita tamanhos entre 1 byte e o limite', () => {
    expect(isValidAvatarSize(1)).toBe(true)
    expect(isValidAvatarSize(MAX_AVATAR_BYTES)).toBe(true)
  })

  test('rejeita zero, negativo ou acima do limite', () => {
    expect(isValidAvatarSize(0)).toBe(false)
    expect(isValidAvatarSize(-1)).toBe(false)
    expect(isValidAvatarSize(MAX_AVATAR_BYTES + 1)).toBe(false)
  })
})
