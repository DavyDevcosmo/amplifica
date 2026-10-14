'use client'

import { LockIcon, MailIcon, UserRoundIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfileAction } from '@/actions/userActions'
import { useIssueTranslator } from '@/components/auth/fieldErrors'
import { IconInput } from '@/components/auth/IconInput'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroupAddon } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { updateProfileSchema } from '@/schemas/userSchema'

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations('account.profile')
  const translateIssue = useIssueTranslator()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string>()

  // o botão só liga quando o nome digitado é diferente do salvo
  const changed = value.trim() !== name

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
        // erro inline no campo; o que foi digitado fica como está
        setError(result.error)
        return
      }
      toast.success(t('updated'))
      // o refresh traz o nome novo pro cabeçalho (layout lê a sessão) sem recarregar
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="name">{t('name')}</FieldLabel>
          <IconInput
            icon={UserRoundIcon}
            id="name"
            name="name"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            aria-invalid={!!error}
            aria-describedby={error ? 'name-error' : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError id="name-error">{error}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
          <IconInput
            icon={MailIcon}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            // desabilitado: não recebe foco nem clique (e-mail não é editável)
            disabled
            groupClassName="bg-muted"
            endAddon={
              <InputGroupAddon align="inline-end" className="pr-3.5">
                <LockIcon className="size-5" strokeWidth={1.8} aria-hidden />
              </InputGroupAddon>
            }
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || !changed}
          className="h-12 w-fit px-6 font-bold"
        >
          {isPending && <Spinner aria-hidden />}
          {isPending ? t('saving') : t('save')}
        </Button>
      </FieldGroup>
    </form>
  )
}
