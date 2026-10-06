'use client'

import { InfoIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useTransition } from 'react'
import { resendCodeAction, verifyEmailAction } from '@/actions/authActions'
import { OtpCodeField } from '@/components/auth/OtpCodeField'
import { OtpStatus } from '@/components/auth/OtpStatus'
import { ResendCode } from '@/components/auth/ResendCode'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { useAuthFlowHydrated } from '@/hooks/useAuthFlowHydrated'
import { useOtpEntry } from '@/hooks/useOtpEntry'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function VerifyEmailForm({
  callbackUrl,
  fromLogin = false,
}: {
  callbackUrl?: string
  // true quando a pessoa chegou aqui pelo login com a conta ainda não verificada
  fromLogin?: boolean
}) {
  const t = useTranslations('auth.verify')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const hydrated = useAuthFlowHydrated()
  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail)
  const entry = useOtpEntry({
    resend: async () => resendCodeAction({ email: pendingEmail ?? '' }),
  })

  // Só decide depois da hidratação do persist: antes disso o estado vem nulo
  // e um F5 aqui mandava a pessoa de volta pro cadastro.
  useEffect(() => {
    if (hydrated && !pendingEmail) router.replace('/signup')
  }, [hydrated, pendingEmail, router])

  if (hydrated && !pendingEmail) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    entry.clearError()
    if (!pendingEmail) return

    if (!/^\d{6}$/.test(entry.otp)) {
      entry.showError(tErrors('otpLength'))
      return
    }

    startTransition(async () => {
      const result = await verifyEmailAction(
        { email: pendingEmail, otp: entry.otp },
        callbackUrl,
      )
      // sucesso: verifyEmailAction faz redirect() e nunca retorna aqui
      if (!result.success) entry.reportFailure(result)
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-section-gap)">
        {fromLogin && (
          <Alert variant="info" role="status">
            <InfoIcon aria-hidden />
            <AlertTitle>{t('unverifiedTitle')}</AlertTitle>
            <AlertDescription>{t('unverifiedBody')}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <OtpCodeField
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
