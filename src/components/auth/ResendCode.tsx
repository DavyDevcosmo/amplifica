'use client'

import { useTranslations } from 'next-intl'
import { formatCountdown } from '@/components/auth/formatCountdown'

// "Não recebeu? Reenviar código" com a contagem do cooldown. Só apresenta:
// quem usa decide `canResend` e o que o reenvio faz.
export function ResendCode({
  canResend,
  secondsLeft,
  isResending,
  message,
  onResend,
}: {
  canResend: boolean
  secondsLeft: number
  isResending: boolean
  message?: string
  onResend: () => void
}) {
  const t = useTranslations('auth.code')

  return (
    <div className="text-center text-sm text-muted-foreground">
      {t('notReceived')}{' '}
      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          {isResending ? t('resending') : t('resend')}
        </button>
      ) : (
        <span>{t('resendIn', { time: formatCountdown(secondsLeft) })}</span>
      )}
      {message && (
        <p role="status" className="mt-1">
          {message}
        </p>
      )}
    </div>
  )
}
