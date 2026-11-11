'use client'

import { StoreIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { becomeSellerAction } from '@/actions/sellerActions'
import { collectFieldErrors, useIssueTranslator } from '@/components/auth/fieldErrors'
import { IconInput } from '@/components/auth/IconInput'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { becomeSellerSchema } from '@/schemas/sellerSchema'

export function BecomeSellerForm() {
  const t = useTranslations('seller.becomeSeller')
  const translateIssue = useIssueTranslator()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = becomeSellerSchema.safeParse({
      displayName,
      bio: bio.trim() ? bio : undefined,
    })
    if (!parsed.success) {
      setErrors(collectFieldErrors(parsed.error.issues, translateIssue))
      return
    }
    setErrors({})

    startTransition(async () => {
      // no sucesso a action redireciona para /seller; só volta aqui se falhar
      const result = await becomeSellerAction(parsed.data)
      if (result && !result.success) setErrors({ form: result.error })
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.displayName}>
          <FieldLabel htmlFor="displayName">{t('displayName')}</FieldLabel>
          <IconInput
            icon={StoreIcon}
            id="displayName"
            name="displayName"
            autoComplete="nickname"
            placeholder={t('displayNamePlaceholder')}
            aria-invalid={!!errors.displayName}
            aria-describedby={errors.displayName ? 'displayName-error' : undefined}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="displayName-error">{errors.displayName}</FieldError>
        </Field>

        <Field data-invalid={!!errors.bio}>
          <FieldLabel htmlFor="bio">
            {t('bio')}
            <span className="font-normal text-muted-foreground">
              {' '}
              · {t('optional')}
            </span>
          </FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            placeholder={t('bioPlaceholder')}
            aria-invalid={!!errors.bio}
            aria-describedby={errors.bio ? 'bio-error' : undefined}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isPending}
          />
          <FieldError id="bio-error">{errors.bio}</FieldError>
        </Field>

        {errors.form ? <FieldError role="alert">{errors.form}</FieldError> : null}

        <Button type="submit" size="xl" disabled={isPending} className="w-fit">
          {isPending && <Spinner aria-hidden />}
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </FieldGroup>
    </form>
  )
}
