import { describe, expect, test } from 'vitest'
import {
  parseStep,
  stepComplete,
  toDraftInput,
  toWizardDraft,
  WIZARD_STEPS,
} from './wizardSteps'

const complete = {
  kinds: ['PRESET' as const],
  title: 'Plexi 68',
  shortDescription: 'Uma frase com mais de dez letras.',
  priceCents: 1000,
}

describe('wizardSteps', () => {
  test('cinco etapas na ordem', () => {
    expect(WIZARD_STEPS.map((step) => step.key)).toEqual([
      'info',
      'classification',
      'files',
      'price',
      'review',
    ])
  })

  test.each([
    ['3', 3],
    [['4', '2'], 4],
    ['9', 1],
    ['abc', 1],
    [undefined, 1],
    ['2.5', 1],
  ] as const)('parseStep(%j) = %i', (value, expected) => {
    expect(parseStep(value as string | string[] | undefined)).toBe(expected)
  })

  test('etapa 1 exige o básico; 2, 3 e 5 sempre ok; 4 exige preço ou gratuito', () => {
    expect(stepComplete(1, complete, 0)).toBe(true)
    expect(stepComplete(1, { ...complete, title: 'ab' }, 0)).toBe(false)
    for (const step of [2, 3, 5] as const) expect(stepComplete(step, {}, 0)).toBe(true)
    expect(stepComplete(4, { ...complete, priceCents: 999 }, 0)).toBe(false)
    expect(stepComplete(4, { ...complete, priceCents: 0, free: true }, 0)).toBe(true)
  })

  test('toDraftInput tira itens em branco e campos de "Outro" desligados', () => {
    const draft = toWizardDraft({
      kinds: ['PRESET'],
      kindOther: 'Patch MIDI',
      includes: ['  8 presets ', '   ', ''],
      styleOther: 'Shoegaze',
      capturedAmp: 'JCM 800',
      captureKind: 'OTHER',
      captureKindOther: 'Pré',
    })
    const input = toDraftInput({ ...draft, styleOtherOn: false })
    expect(input.includes).toEqual(['8 presets'])
    expect(input.kindOther).toBeUndefined()
    expect(input.styleOther).toBeUndefined()
    expect(input.capturedAmp).toBeUndefined()
    expect(input.captureKind).toBeUndefined()
    expect(input.captureKindOther).toBeUndefined()
  })

  test('toDraftInput mantém os campos de captura com Capture marcado', () => {
    const draft = toWizardDraft({
      kinds: ['CAPTURE'],
      capturedAmp: 'JCM 800',
      captureKind: 'OTHER',
      captureKindOther: 'Pré',
      styleOther: 'Shoegaze',
    })
    expect(draft.styleOtherOn).toBe(true)
    expect(toDraftInput(draft)).toMatchObject({
      capturedAmp: 'JCM 800',
      captureKind: 'OTHER',
      captureKindOther: 'Pré',
      styleOther: 'Shoegaze',
    })
  })
})
