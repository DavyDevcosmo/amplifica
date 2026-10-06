'use client'

import { CircleAlertIcon, MailIcon, UserRoundIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { signUpAction } from '@/actions/authActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { IconInput } from '@/components/auth/IconInput'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { signUpFormSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function SignUpForm() {
  const t = useTranslations('auth.signUp')
  const tShared = useTranslations('auth.shared')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  const setPendingEmail = useAuthFlowStore((state) => state.setPendingEmail)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const startOtpWindow = useAuthFlowStore((state) => state.startOtpWindow)

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = signUpFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setFieldErrors({})
    // a confirmação já cumpriu o papel aqui — não vai pro servidor
    const { confirmPassword: _confirmPassword, ...input } = parsed.data

    startTransition(async () => {
      const result = await signUpAction(input)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setPendingEmail(result.data.email)
      setResendAvailableAt(Date.now() + 60_000)
      startOtpWindow()
      router.push('/signup/verify')
    })
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-gap)">
        {hasFieldErrors && (
          // role=status: o resumo não duplica o anúncio dos erros de cada campo (role=alert)
          <Alert variant="destructive" role="status">
            <CircleAlertIcon aria-hidden />
            <AlertTitle>{t('reviewFields')}</AlertTitle>
          </Alert>
        )}
        <Field data-invalid={!!fieldErrors.name}>
          <FieldLabel htmlFor="name">{t('name')}</FieldLabel>
          <IconInput
            icon={UserRoundIcon}
            id="name"
            name="name"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="name-error">{fieldErrors.name}</FieldError>
        </Field>
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
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="email-error">{fieldErrors.email}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
            value={values.password}
            onChange={(e) => update('password', e.target.value)}
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
            autoComplete="new-password"
            placeholder={t('confirmPasswordPlaceholder')}
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={
              fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
            }
            value={values.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
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
      </FieldGroup>
    </form>
  )
}
