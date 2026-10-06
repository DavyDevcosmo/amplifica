'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'
import { resetPasswordAction } from '@/actions/authActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { OtpStatus } from '@/components/auth/OtpStatus'
import { otpErrorKind } from '@/components/auth/otpError'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { useAuthFlowHydrated } from '@/hooks/useAuthFlowHydrated'
import { useOtpWindow } from '@/hooks/useOtpWindow'
import { newPasswordFormSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

// Passo 3 da redefinição de senha: o código já foi conferido em /password/code
// (fica na store, só em memória) — aqui só se escolhe a nova senha. O servidor
// confere o código de novo ao trocar a senha, então a guarda abaixo é só UX.
export function ResetPasswordForm() {
  const t = useTranslations('auth.reset')
  const tShared = useTranslations('auth.shared')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  // true depois do sucesso: `reset()` zera o e-mail e isso não pode virar um
  // redirect pra /password/forgot por cima do push pro login
  const finished = useRef(false)

  const hydrated = useAuthFlowHydrated()
  const resetEmail = useAuthFlowStore((state) => state.resetEmail)
  const verifiedOtp = useAuthFlowStore((state) => state.verifiedResetOtp)
  const setVerifiedResetOtp = useAuthFlowStore((state) => state.setVerifiedResetOtp)
  const registerOtpFailure = useAuthFlowStore((state) => state.registerOtpFailure)
  const expireOtp = useAuthFlowStore((state) => state.expireOtp)
  const exhaustOtp = useAuthFlowStore((state) => state.exhaustOtp)
  const resetFlow = useAuthFlowStore((state) => state.reset)
  const otpWindow = useOtpWindow()

  // Sem e-mail → recomeça pedindo o e-mail; sem código conferido (acesso
  // direto, F5) → volta pro passo do código. Só decide depois da hidratação do
  // persist, senão um F5 redirecionaria por engano.
  useEffect(() => {
    if (!hydrated || finished.current) return
    if (!resetEmail) router.replace('/password/forgot')
    else if (!verifiedOtp) router.replace('/password/code')
  }, [hydrated, resetEmail, verifiedOtp, router])

  // O código venceu enquanto a pessoa digitava a senha: descarta e volta pro
  // passo do código, que já mostra "expirou" e libera o reenvio.
  useEffect(() => {
    if (otpWindow.expired && verifiedOtp) setVerifiedResetOtp(null)
  }, [otpWindow.expired, verifiedOtp, setVerifiedResetOtp])

  if (hydrated && (!resetEmail || !verifiedOtp)) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)
    if (!resetEmail || !verifiedOtp) return

    const parsed = newPasswordFormSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      setFieldErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      const result = await resetPasswordAction({
        email: resetEmail,
        otp: verifiedOtp,
        password: parsed.data.password,
      })
      if (!result.success) {
        const kind = otpErrorKind(result.code)
        if (kind === 'other') {
          setFormError(result.error)
          return
        }
        // o código deixou de valer: atualiza a store e a guarda acima leva a
        // pessoa de volta pro passo do código
        if (kind === 'expired') expireOtp()
        else if (kind === 'exhausted') exhaustOtp()
        else registerOtpFailure()
        setVerifiedResetOtp(null)
        return
      }
      finished.current = true
      resetFlow()
      // a tela de login mostra o aviso de senha redefinida
      router.push('/login?senha=redefinida')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-gap)">
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">{t('newPassword')}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            placeholder={t('newPasswordPlaceholder')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
          />
          {fieldErrors.password ? (
            <FieldError id="password-error">{fieldErrors.password}</FieldError>
          ) : (
            <FieldDescription id="password-hint">
              {tShared('passwordHint')}
            </FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!fieldErrors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')}</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder={t('confirmPasswordPlaceholder')}
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={
              fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
            }
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="confirmPassword-error">
            {fieldErrors.confirmPassword}
          </FieldError>
        </Field>

        <FieldError>{formError}</FieldError>

        <Button
          type="submit"
          size="xl"
          disabled={isPending}
          className="h-(--auth-control-h) w-full"
        >
          {isPending ? t('submitting') : t('submit')}
        </Button>

        <OtpStatus secondsLeft={otpWindow.secondsLeft} />
      </FieldGroup>
    </form>
  )
}
