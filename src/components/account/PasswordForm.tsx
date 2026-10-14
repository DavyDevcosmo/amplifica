'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { changePasswordAction, setPasswordAction } from '@/actions/userActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { changePasswordFormSchema, setPasswordFormSchema } from '@/schemas/userSchema'

const EMPTY = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

// Troca de senha (exige a senha atual) ou, pra conta criada só com o Google,
// definição de senha (sem senha atual). Mesmo formulário, dois modos.
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations('account.security.password')
  const tShared = useTranslations('auth.shared')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = hasPassword
      ? changePasswordFormSchema.safeParse(values)
      : setPasswordFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      // a confirmação já cumpriu o papel aqui — não vai pro servidor
      const result = hasPassword
        ? await changePasswordAction({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          })
        : await setPasswordAction({ newPassword: values.newPassword })

      if (!result.success) {
        if (result.code === 'INVALID_PASSWORD') {
          setFieldErrors({ currentPassword: result.error })
        } else {
          setFormError(result.error)
        }
        return
      }
      toast.success(hasPassword ? t('changed') : t('wasSet'))
      setValues(EMPTY)
      // depois de definir a senha, a página passa a mostrar o modo "trocar"
      router.refresh()
    })
  }

  const newPasswordHint = hasPassword ? t('newHint') : tShared('passwordHint')

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        {hasPassword && (
          <Field data-invalid={!!fieldErrors.currentPassword}>
            <FieldLabel htmlFor="currentPassword">{t('current')}</FieldLabel>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              placeholder={t('currentPlaceholder')}
              aria-invalid={!!fieldErrors.currentPassword}
              aria-describedby={
                fieldErrors.currentPassword ? 'currentPassword-error' : undefined
              }
              value={values.currentPassword}
              onChange={(e) => update('currentPassword', e.target.value)}
              disabled={isPending}
              required
            />
            <FieldError id="currentPassword-error">
              {fieldErrors.currentPassword}
            </FieldError>
          </Field>
        )}

        <Field data-invalid={!!fieldErrors.newPassword}>
          <FieldLabel htmlFor="newPassword">{t('new')}</FieldLabel>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            placeholder={t('newPlaceholder')}
            aria-invalid={!!fieldErrors.newPassword}
            aria-describedby={
              fieldErrors.newPassword ? 'newPassword-error' : 'newPassword-hint'
            }
            value={values.newPassword}
            onChange={(e) => update('newPassword', e.target.value)}
            disabled={isPending}
            required
          />
          {fieldErrors.newPassword ? (
            <FieldError id="newPassword-error">{fieldErrors.newPassword}</FieldError>
          ) : (
            <FieldDescription id="newPassword-hint">{newPasswordHint}</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!fieldErrors.confirmNewPassword}>
          <FieldLabel htmlFor="confirmNewPassword">{t('confirm')}</FieldLabel>
          <PasswordInput
            id="confirmNewPassword"
            name="confirmNewPassword"
            autoComplete="new-password"
            placeholder={t('confirmPlaceholder')}
            aria-invalid={!!fieldErrors.confirmNewPassword}
            aria-describedby={
              fieldErrors.confirmNewPassword ? 'confirmNewPassword-error' : undefined
            }
            value={values.confirmNewPassword}
            onChange={(e) => update('confirmNewPassword', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="confirmNewPassword-error">
            {fieldErrors.confirmNewPassword}
          </FieldError>
        </Field>

        <FieldError>{formError}</FieldError>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 w-fit px-6 font-bold"
        >
          {isPending && <Spinner aria-hidden />}
          {isPending ? t('saving') : hasPassword ? t('change') : t('set')}
        </Button>
      </FieldGroup>
    </form>
  )
}
