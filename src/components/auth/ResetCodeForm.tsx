'use client'

import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useTransition } from 'react'
import { forgotPasswordAction, verifyResetCodeAction } from '@/actions/authActions'
import { OtpCodeField } from '@/components/auth/OtpCodeField'
import { OtpStatus } from '@/components/auth/OtpStatus'
import { ResendCode } from '@/components/auth/ResendCode'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useAuthFlowHydrated } from '@/hooks/useAuthFlowHydrated'
import { useOtpEntry } from '@/hooks/useOtpEntry'
import { useAuthFlowStore } from '@/stores/authFlowStore'

// Passo 2 da redefinição de senha: só o código. Se estiver certo, guarda o
// código na store e segue pra /password/reset, onde se escolhe a nova senha.
export function ResetCodeForm() {
  const t = useTranslations('auth.resetCode')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const hydrated = useAuthFlowHydrated()
  const resetEmail = useAuthFlowStore((state) => state.resetEmail)
  const setVerifiedResetOtp = useAuthFlowStore((state) => state.setVerifiedResetOtp)
  const entry = useOtpEntry({
    resend: async () => forgotPasswordAction({ email: resetEmail ?? '' }),
  })

  // Sem e-mail (aba nova, sessionStorage vazio) não há para quem validar o
  // código. Só decide depois da hidratação do persist, senão um F5 redirecionaria.
  useEffect(() => {
    if (hydrated && !resetEmail) router.replace('/password/forgot')
  }, [hydrated, resetEmail, router])

  if (hydrated && !resetEmail) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    entry.clearError()
    if (!resetEmail) return

    if (!/^\d{6}$/.test(entry.otp)) {
      entry.showError(tErrors('otpLength'))
      return
    }

    startTransition(async () => {
      const result = await verifyResetCodeAction({ email: resetEmail, otp: entry.otp })
      if (!result.success) {
        entry.reportFailure(result)
        return
      }
      setVerifiedResetOtp(entry.otp)
      router.push('/password/reset')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-gap)">
        <Alert variant="info" role="status">
          <InfoIcon aria-hidden />
          <AlertDescription className="text-sm font-medium">
            {resetEmail
              ? t.rich('sentTo', {
                  email: resetEmail,
                  strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
                })
              : null}{' '}
            <Link
              href="/password/forgot"
              className="-my-2.5 inline-flex min-h-11 items-center rounded-sm font-semibold underline underline-offset-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('useOtherEmail')}
            </Link>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <OtpCodeField
            showLabel
            value={entry.otp}
            onChange={entry.handleChange}
            error={entry.message}
            errorId="otp-error"
            disabled={isPending}
          />
          <OtpStatus
            secondsLeft={entry.otpWindow.secondsLeft}
            attemptsLeft={entry.otpWindow.attemptsLeft}
          />
        </div>

        <Button
          type="submit"
          size="xl"
          disabled={isPending || entry.submitBlocked}
          className="h-(--auth-control-h) w-full"
        >
          {isPending ? t('submitting') : t('submit')}
        </Button>

        <ResendCode {...entry.resend} />
      </FieldGroup>
    </form>
  )
}
