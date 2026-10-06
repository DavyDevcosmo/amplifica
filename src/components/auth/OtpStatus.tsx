'use client'

import { useTranslations } from 'next-intl'
import { formatCountdown } from '@/components/auth/formatCountdown'
import { OTP_MAX_ATTEMPTS } from '@/lib/otpConfig'
import { cn } from '@/lib/utils'

// Faltando menos que isso, o prazo passa a chamar atenção.
const URGENT_SECONDS = 60

// "O código expira em 4:47" + "Você tem mais 2 tentativas". Só apresenta:
// quem usa passa os números (ver useOtpWindow). Some quando o código já
// expirou ou esgotou — aí o aviso de erro do campo é que fala.
export function OtpStatus({
  secondsLeft,
  attemptsLeft,
}: {
  secondsLeft: number
  // omitido na tela de nova senha, onde o código já foi conferido
  attemptsLeft?: number | null
}) {
  const t = useTranslations('auth.code')

  const showExpiry = secondsLeft > 0
  const showAttempts = attemptsLeft != null && attemptsLeft > 0
  if (!showExpiry && !showAttempts) return null

  return (
    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
      {showAttempts && (
        <p>
          {attemptsLeft === OTP_MAX_ATTEMPTS
            ? t('attemptsInitial', { count: attemptsLeft })
            : t('attemptsLeft', { count: attemptsLeft })}
        </p>
      )}
      {showExpiry && (
        // role=timer: não anuncia a cada segundo pro leitor de tela
        <p
          role="timer"
          className={cn(
            secondsLeft <= URGENT_SECONDS && 'font-medium text-destructive',
          )}
        >
          {t('expiresIn', { time: formatCountdown(secondsLeft) })}
        </p>
      )}
    </div>
  )
}
