'use client'

import { useTranslations } from 'next-intl'

type Issue = { path: PropertyKey[]; message: string }

// As mensagens dos schemas Zod são CHAVES do namespace `errors`. Aqui elas
// viram texto no idioma atual; chave desconhecida cai em "Dados inválidos"
// em vez de mostrar a chave crua.
export function useIssueTranslator() {
  const t = useTranslations('errors')
  return (key: string) => (t.has(key) ? t(key) : t('invalidData'))
}

// Um erro por campo (o primeiro issue de cada `path[0]`).
export function collectFieldErrors(
  issues: readonly Issue[],
  translate: (key: string) => string,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !errors[key]) errors[key] = translate(issue.message)
  }
  return errors
}
