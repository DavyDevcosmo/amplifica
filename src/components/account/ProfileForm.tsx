'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfileAction } from '@/actions/userActions'
import { useIssueTranslator } from '@/components/auth/fieldErrors'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updateProfileSchema } from '@/schemas/userSchema'

export function ProfileForm({ name }: { name: string }) {
  const t = useTranslations('account')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string>()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = updateProfileSchema.safeParse({ name: value })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message
      setError(message ? translateIssue(message) : undefined)
      return
    }
    setError(undefined)

    startTransition(async () => {
      const result = await updateProfileAction(parsed.data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t('profileUpdated'))
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="name">{t('name')}</FieldLabel>
          <Input
            id="name"
            name="name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{error}</FieldError>
        </Field>
        <Button type="submit" disabled={isPending || value === name} className="w-fit">
          {isPending ? t('saving') : t('saveName')}
        </Button>
      </FieldGroup>
    </form>
  )
}
