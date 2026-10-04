import type { Locale } from '@/i18n/config'

// Um arquivo por área em src/messages/<locale>/: `ui.json` (telas e
// componentes) e `errors.json` (validação e erros de action). O `errors` vira
// o namespace "errors" — useTranslations('errors').
export async function loadMessages(locale: Locale) {
  const [ui, errors] = await Promise.all([
    import(`../messages/${locale}/ui.json`),
    import(`../messages/${locale}/errors.json`),
  ])
  return { ...ui.default, errors: errors.default }
}
