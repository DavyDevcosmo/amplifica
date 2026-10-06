'use client'

import { MailIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { signInAction } from '@/actions/authActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { IconInput } from '@/components/auth/IconInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useCountdown } from '@/hooks/useCountdown'
import { safeCallbackUrl } from '@/lib/utils'
import { signInSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('auth.signIn')
  const tShared = useTranslations('auth.shared')
  const tErrors = useTranslations('errors')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()

  const lockedUntil = useAuthFlowStore((state) => state.lockedUntil)
  const setLockedUntil = useAuthFlowStore((state) => state.setLockedUntil)
  const setPendingEmail = useAuthFlowStore((state) => state.setPendingEmail)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const startOtpWindow = useAuthFlowStore((state) => state.startOtpWindow)
  const lockedSecondsLeft = useCountdown(lockedUntil)
  const isLocked = lockedSecondsLeft > 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      // um erro por campo: cada input mostra só a mensagem que é dele
      setFieldErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      const result = await signInAction(parsed.data)
      if (!result.success) {
        // bloqueio por tentativas: guarda o horário só pra manter o aviso
        // (e os campos desabilitados) visível entre re-renders
        const minutes =
          result.code === 'LOGIN_LOCKED' ? Number(result.params?.minutes) : null
        if (minutes) {
          setLockedUntil(Date.now() + minutes * 60_000)
        }
        setFormError(result.error)
        return
      }
      if (result.data.status === 'needsVerification') {
        setPendingEmail(email)
        // o Better Auth já reenviou o código sozinho (sendOnSignIn) — o
        // cooldown de reenvio local também precisa começar a contar agora
        setResendAvailableAt(Date.now() + 60_000)
        startOtpWindow()
        router.push(
          `/signup/verify?origem=login&callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`,
        )
        return
      }
      router.push(safeCallbackUrl(callbackUrl))
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-gap)">
        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">{tShared('email')}</FieldLabel>
          <IconInput
            icon={MailIcon}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending || isLocked}
            required
          />
          <FieldError id="email-error">{fieldErrors.email}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending || isLocked}
            required
          />
          <FieldError id="password-error">{fieldErrors.password}</FieldError>
        </Field>

        <div className="-my-2 flex justify-end">
          <Link
            href="/password/forgot"
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary outline-none hover:text-primary-hover hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t('forgot')}
          </Link>
        </div>

        {isLocked ? (
          <FieldError>
            {tErrors('loginLocked', { minutes: Math.ceil(lockedSecondsLeft / 60) })}
          </FieldError>
        ) : (
          <FieldError>{formError}</FieldError>
        )}

        <Button
          type="submit"
          size="xl"
          disabled={isPending || isLocked}
          className="h-(--auth-control-h) w-full"
        >
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </FieldGroup>
    </form>
  )
}
