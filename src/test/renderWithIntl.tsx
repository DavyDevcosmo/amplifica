import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import errors from '@/messages/pt-BR/errors.json'
import ui from '@/messages/pt-BR/ui.json'

// Renderiza com o NextIntlClientProvider em pt-BR (mensagens reais), pra os
// testes de componente continuarem procurando os textos em português.
export function renderWithIntl(ui_: ReactElement, locale = 'pt-BR') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{ ...ui, errors }}>
      {ui_}
    </NextIntlClientProvider>,
  )
}
