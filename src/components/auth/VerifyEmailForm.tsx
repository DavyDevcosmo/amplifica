'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { resendCodeAction, verifyEmailAction } from '@/actions/authActions'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useCountdown } from '@/hooks/useCountdown'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function VerifyEmailForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isResending, startResendTransition] = useTransition()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string>()
  const [resendMessage, setResendMessage] = useState<string>()

  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail)
  const resendAvailableAt = useAuthFlowStore((state) => state.resendAvailableAt)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const secondsLeft = useCountdown(resendAvailableAt)

  useEffect(() => {
    if (!pendingEmail) router.replace('/cadastro')
  }, [pendingEmail, router])

  if (!pendingEmail) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(undefined)

    if (!/^\d{6}$/.test(otp)) {
      setError('O código tem 6 dígitos')
      return
    }

    startTransition(async () => {
      // biome-ignore lint/style/noNonNullAssertion: guard acima já garante pendingEmail non-null neste componente
      const result = await verifyEmailAction({ email: pendingEmail!, otp }, callbackUrl)
      // sucesso: verifyEmailAction faz redirect() e nunca retorna aqui
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  function handleResend() {
    setResendMessage(undefined)
    startResendTransition(async () => {
      // biome-ignore lint/style/noNonNullAssertion: guard acima já garante pendingEmail non-null neste componente
      const result = await resendCodeAction({ email: pendingEmail! })
      if (!result.success) {
        setResendMessage(result.error)
        return
      }
      setResendAvailableAt(Date.now() + 60_000)
      setResendMessage('Código reenviado.')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para{' '}
          <strong className="font-medium text-foreground">{pendingEmail}</strong>. Ele
          vale por 10 minutos.
        </p>

        <div className="flex flex-col items-center gap-2">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isPending}
            aria-invalid={!!error}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError>{error}</FieldError>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Confirmando…' : 'Confirmar e-mail'}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {secondsLeft > 0 ? (
            <span>Reenviar código em {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              {isResending ? 'Reenviando…' : 'Reenviar código'}
            </button>
          )}
          {resendMessage && <p className="mt-1">{resendMessage}</p>}
        </div>
      </FieldGroup>
    </form>
  )
}
