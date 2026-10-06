'use client'

import { useTranslations } from 'next-intl'
import { useAuthFlowHydrated } from '@/hooks/useAuthFlowHydrated'
import { useAuthFlowStore } from '@/stores/authFlowStore'

// Descrição da tela de verificação: mostra o e-mail que está aguardando código.
// Fica separada do formulário para o título continuar vindo do servidor.
export function PendingEmailNotice() {
  const t = useTranslations('auth.verify')
  const hydrated = useAuthFlowHydrated()
  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail)

  // reserva a altura da linha enquanto o sessionStorage é lido (evita salto)
  if (!hydrated) return <span aria-hidden className="inline-block h-6" />
  if (!pendingEmail) return null

  return t.rich('notice', {
    email: pendingEmail,
    strong: (chunks) => (
      <strong className="font-semibold text-foreground">{chunks}</strong>
    ),
  })
}
