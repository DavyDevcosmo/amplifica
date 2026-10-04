// Idiomas suportados. O idioma fica num cookie (sem prefixo na URL): é uma
// preferência da pessoa, não uma rota diferente.
export const locales = ['pt-BR', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'pt-BR'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
