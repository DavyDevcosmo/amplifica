'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { changePasswordAction } from '@/actions/userActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { changePasswordSchema } from '@/schemas/userSchema'

export function ChangePasswordForm() {
  const t = useTranslations('account')
  const translateIssue = useIssueTranslator()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = changePasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      const result = await changePasswordAction(parsed.data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t('passwordChanged'))
      setValues({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!fieldErrors.currentPassword}>
          <FieldLabel htmlFor="currentPassword">{t('currentPassword')}</FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(e) => update('currentPassword', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.currentPassword}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.newPassword}>
          <FieldLabel htmlFor="newPassword">{t('newPassword')}</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(e) => update('newPassword', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.newPassword}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.confirmNewPassword}>
          <FieldLabel htmlFor="confirmNewPassword">
            {t('confirmNewPassword')}
          </FieldLabel>
          <Input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmNewPassword}
            onChange={(e) => update('confirmNewPassword', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.confirmNewPassword}</FieldError>
        </Field>
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? t('saving') : t('changePassword')}
        </Button>
      </FieldGroup>
    </form>
  )
}
