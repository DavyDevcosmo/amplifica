import { describe, expect, test } from 'vitest'
import {
  becomeSellerSchema,
  PROFILE_DEVICES,
  sellerProfileSchema,
} from './sellerSchema'

describe('becomeSellerSchema', () => {
  test('valida o nome de vendedor', () => {
    expect(becomeSellerSchema.safeParse({ displayName: ' T ' }).success).toBe(false)
    expect(becomeSellerSchema.safeParse({ displayName: 'Tiago Ramos' }).success).toBe(
      true,
    )
    expect(becomeSellerSchema.safeParse({ displayName: 'x'.repeat(41) }).success).toBe(
      false,
    )
  })

  test('aponta a chave de erro de cada limite', () => {
    const short = becomeSellerSchema.safeParse({ displayName: 'T' })
    expect(short.error?.issues[0]?.message).toBe('displayNameTooShort')
    const long = becomeSellerSchema.safeParse({ displayName: 'x'.repeat(41) })
    expect(long.error?.issues[0]?.message).toBe('displayNameTooLong')
    const bio = becomeSellerSchema.safeParse({
      displayName: 'Tiago',
      bio: 'x'.repeat(401),
    })
    expect(bio.error?.issues[0]?.message).toBe('bioTooLong')
  })

  test('a bio é opcional e vem sem espaços nas pontas', () => {
    const parsed = becomeSellerSchema.parse({ displayName: ' Tiago ', bio: ' oi ' })
    expect(parsed).toEqual({ displayName: 'Tiago', bio: 'oi' })
    expect(becomeSellerSchema.safeParse({ displayName: 'Tiago' }).success).toBe(true)
  })
})

describe('sellerProfileSchema', () => {
  const base = { displayName: 'Tiago Ramos', devices: [] as string[] }

  test('limpa @ e recusa spotify de outro site', () => {
    expect(
      sellerProfileSchema.parse({ ...base, instagram: '@tiago.tone' }).instagram,
    ).toBe('tiago.tone')
    expect(sellerProfileSchema.parse({ ...base, tiktok: ' @tiago_tone ' }).tiktok).toBe(
      'tiago_tone',
    )
    expect(sellerProfileSchema.parse({ ...base, youtube: '@tiagoramos' }).youtube).toBe(
      'tiagoramos',
    )
    expect(
      sellerProfileSchema.safeParse({ ...base, spotifyUrl: 'https://evil.com/x' })
        .success,
    ).toBe(false)
    expect(
      sellerProfileSchema.safeParse({
        ...base,
        spotifyUrl: 'https://open.spotify.com.evil.com/x',
      }).success,
    ).toBe(false)
    expect(
      sellerProfileSchema.safeParse({
        ...base,
        spotifyUrl: 'https://open.spotify.com/artist/123',
      }).success,
    ).toBe(true)
  })

  test('redes e cidade são opcionais e aceitam vazio', () => {
    const parsed = sellerProfileSchema.parse({
      ...base,
      instagram: '',
      tiktok: '',
      youtube: '',
      spotifyUrl: '',
      city: '',
    })
    expect(parsed.instagram).toBe('')
    expect(sellerProfileSchema.safeParse(base).success).toBe(true)
  })

  test('recusa handle com caractere inválido ou longo demais', () => {
    expect(sellerProfileSchema.safeParse({ ...base, instagram: 'a b' }).success).toBe(
      false,
    )
    expect(
      sellerProfileSchema.safeParse({ ...base, tiktok: 'x'.repeat(31) }).success,
    ).toBe(false)
    expect(
      sellerProfileSchema.safeParse({ ...base, youtube: 'x'.repeat(101) }).success,
    ).toBe(false)
    const bad = sellerProfileSchema.safeParse({ ...base, instagram: 'a/b' })
    expect(bad.error?.issues[0]?.message).toBe('handleInvalid')
  })

  test('pedaleiras só da lista e no máximo 8', () => {
    expect(
      sellerProfileSchema.safeParse({ ...base, devices: ['Line 6', 'Kemper'] }).success,
    ).toBe(true)
    expect(
      sellerProfileSchema.safeParse({ ...base, devices: ['Gibson'] }).success,
    ).toBe(false)
    expect(PROFILE_DEVICES).toHaveLength(8)
  })

  test('limites de nome, bio e cidade apontam a chave de erro', () => {
    const name = sellerProfileSchema.safeParse({ ...base, displayName: 'T' })
    expect(name.error?.issues[0]?.message).toBe('displayNameTooShort')
    const bio = sellerProfileSchema.safeParse({ ...base, bio: 'x'.repeat(401) })
    expect(bio.error?.issues[0]?.message).toBe('bioTooLong')
    const city = sellerProfileSchema.safeParse({ ...base, city: 'x'.repeat(61) })
    expect(city.error?.issues[0]?.message).toBe('cityTooLong')
  })
})
