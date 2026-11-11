import { describe, expect, test } from 'vitest'
import {
  isEditable,
  isYoutubeUrl,
  listStatusOf,
  productDraftSchema,
  productSubmitSchema,
  submitChecklist,
} from './productSchema'

const valid = {
  kinds: ['PRESET'] as const,
  title: 'Plexi 68',
  shortDescription: 'Plexi completo em snapshots',
  priceCents: 1000,
}
const validDraft = { ...valid, kinds: [...valid.kinds] }

function messages(result: {
  success: boolean
  error?: { issues: { message: string }[] }
}) {
  return result.error?.issues.map((issue) => issue.message) ?? []
}

describe('productDraftSchema / productSubmitSchema', () => {
  test('rascunho aceita vazio; envio exige o básico', () => {
    expect(productDraftSchema.safeParse({}).success).toBe(true)
    const r = productSubmitSchema.safeParse({
      kinds: [],
      title: 'ab',
      shortDescription: 'curta',
      priceCents: 999,
    })
    expect(r.success).toBe(false)
    expect(messages(r)).toEqual(
      expect.arrayContaining([
        'kindsRequired',
        'titleTooShort',
        'shortDescriptionTooShort',
        'priceBelowMinimum',
      ]),
    )
    expect(productSubmitSchema.safeParse(valid).success).toBe(true)
    expect(
      productSubmitSchema.safeParse({
        kinds: ['IR'],
        title: 'IR 4x12',
        shortDescription: 'Quatro IRs de caixa 4x12',
        priceCents: 0,
        free: true,
      }).success,
    ).toBe(true)
  })

  test('rascunho vazio sai com os defaults', () => {
    const parsed = productDraftSchema.parse({})
    expect(parsed).toMatchObject({
      kinds: [],
      title: '',
      shortDescription: '',
      about: '',
      includes: [],
      styles: [],
      priceCents: 0,
      free: false,
    })
  })

  test('Outro exige texto e estilos somam no máximo 3', () => {
    const other = productSubmitSchema.safeParse({ ...valid, kinds: ['OTHER'] })
    expect(other.success).toBe(false)
    expect(messages(other)).toContain('kindOtherRequired')
    expect(
      productSubmitSchema.safeParse({
        ...valid,
        kinds: ['OTHER'],
        kindOther: 'Patch MIDI',
      }).success,
    ).toBe(true)
    expect(
      productDraftSchema.safeParse({
        styles: ['Blues', 'Pop', 'Jazz'],
        styleOther: 'Sertanejo',
      }).success,
    ).toBe(false)
    expect(
      productDraftSchema.safeParse({
        styles: ['Blues', 'Pop'],
        styleOther: 'Sertanejo',
      }).success,
    ).toBe(true)
    expect(productDraftSchema.safeParse({ styles: ['Sertanejo'] }).success).toBe(false)
  })

  test('youtubeUrl só aceita YouTube', () => {
    expect(
      productDraftSchema.safeParse({ youtubeUrl: 'https://youtu.be/abc' }).success,
    ).toBe(true)
    expect(
      productDraftSchema.safeParse({
        youtubeUrl: 'https://www.youtube.com/watch?v=abc',
      }).success,
    ).toBe(true)
    expect(productDraftSchema.safeParse({ youtubeUrl: '' }).success).toBe(true)
    expect(
      productDraftSchema.safeParse({ youtubeUrl: 'https://vimeo.com/1' }).success,
    ).toBe(false)
    expect(isYoutubeUrl('https://youtube.com.evil.com/x')).toBe(false)
    expect(isYoutubeUrl('javascript:alert(1)')).toBe(false)
  })

  test('preço é inteiro em centavos dentro do teto', () => {
    expect(productDraftSchema.safeParse({ priceCents: 9.99 }).success).toBe(false)
    expect(productDraftSchema.safeParse({ priceCents: -1 }).success).toBe(false)
    const tooHigh = productDraftSchema.safeParse({ priceCents: 100_000_01 })
    expect(tooHigh.success).toBe(false)
    expect(tooHigh.error?.issues[0]?.message).toBe('priceTooHigh')
    expect(productDraftSchema.safeParse({ priceCents: 100_000_00 }).success).toBe(true)
  })
})

describe('listStatusOf / isEditable', () => {
  test('listStatusOf', () => {
    expect(listStatusOf({ status: 'PUBLISHED' }, { status: 'PENDING_REVIEW' })).toBe(
      'review',
    )
    expect(listStatusOf({ status: 'PUBLISHED' }, { status: 'DRAFT' })).toBe('published')
    expect(listStatusOf({ status: 'PUBLISHED' }, { status: 'APPROVED' })).toBe(
      'published',
    )
    expect(listStatusOf({ status: 'REJECTED' }, { status: 'REJECTED' })).toBe(
      'rejected',
    )
    expect(listStatusOf({ status: 'DRAFT' }, { status: 'DRAFT' })).toBe('draft')
    expect(listStatusOf({ status: 'DRAFT' }, null)).toBe('draft')
    expect(listStatusOf({ status: 'ARCHIVED' }, { status: 'APPROVED' })).toBeNull()
    expect(
      listStatusOf({ status: 'ARCHIVED' }, { status: 'PENDING_REVIEW' }),
    ).toBeNull()
  })

  test('isEditable é falso só em análise', () => {
    expect(isEditable('review')).toBe(false)
    expect(isEditable('draft')).toBe(true)
    expect(isEditable('published')).toBe(true)
    expect(isEditable('rejected')).toBe(true)
  })
})

describe('submitChecklist', () => {
  test('aponta só o que falta', () => {
    expect(submitChecklist(validDraft, 0)).toEqual([
      { id: 'basics', ok: true },
      { id: 'files', ok: false },
      { id: 'price', ok: true },
    ])
    expect(submitChecklist({}, 2)).toEqual([
      { id: 'basics', ok: false },
      { id: 'files', ok: true },
      { id: 'price', ok: false },
    ])
  })

  test('gratuito cumpre o preço', () => {
    expect(submitChecklist({ ...validDraft, priceCents: 0, free: true }, 1)).toEqual([
      { id: 'basics', ok: true },
      { id: 'files', ok: true },
      { id: 'price', ok: true },
    ])
  })
})
