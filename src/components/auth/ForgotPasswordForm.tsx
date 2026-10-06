'use client'

import { MailIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { forgotPasswordAction } from '@/actions/authActions'
import { useIssueTranslator } from '@/components/auth/fieldErrors'
import { IconInput } from '@/components/auth/IconInput'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { forgotPasswordSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot')
  const tShared = useTranslations('auth.shared')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const setResetEmail = useAuthFlowStore((state) => state.setResetEmail)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const startOtpWindow = useAuthFlowStore((state) => state.startOtpWindow)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message
      setFieldError(message ? translateIssue(message) : undefined)
      return
    }
    setFieldError(undefined)

    startTransition(async () => {
      const result = await forgotPasswordAction(parsed.data)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      // a resposta é a mesma exista ou não a conta; o código só chega se existir
      setResetEmail(parsed.data.email)
      setResendAvailableAt(Date.now() + 60_000)
      startOtpWindow()
      router.push('/password/code')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-(--auth-gap)">
        <Field data-invalid={!!fieldError}>
          <FieldLabel htmlFor="email">{tShared('email')}</FieldLabel>
          <IconInput
            icon={MailIcon}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'email-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="email-error">{fieldError}</FieldError>
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
