import { describe, expect, test } from 'vitest'
import enErrors from './en/errors.json'
import enUi from './en/ui.json'
import ptErrors from './pt-BR/errors.json'
import ptUi from './pt-BR/ui.json'

// Caminhos de todas as folhas ("auth.signIn.title"), pra comparar os idiomas.
function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('mensagens', () => {
  test('ui.json tem as mesmas chaves em pt-BR e en', () => {
    expect(leafKeys(enUi).sort()).toEqual(leafKeys(ptUi).sort())
  })

  test('errors.json tem as mesmas chaves em pt-BR e en', () => {
    expect(leafKeys(enErrors).sort()).toEqual(leafKeys(ptErrors).sort())
  })

  test('nenhum texto fica vazio', () => {
    for (const messages of [ptUi, enUi, ptErrors, enErrors]) {
      for (const key of leafKeys(messages)) {
        const value = key
          .split('.')
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown>)[part],
            messages,
          )
        expect(value, key).toBeTruthy()
      }
    }
  })
})
