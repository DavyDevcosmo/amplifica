'use client'

import { useState, useTransition } from 'react'
import { forgotPasswordAction } from '@/actions/authActions'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { forgotPasswordSchema } from '@/schemas/authSchema'

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [sent, setSent] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)

    startTransition(async () => {
      await forgotPasswordAction(parsed.data)
      // sempre a mesma resposta, exista ou não o e-mail
      setSent(true)
    })
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Se <strong className="font-medium text-foreground">{email}</strong> tiver uma
        conta, enviamos um link pra redefinir a senha. Ele vale por 1 hora.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!fieldError}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldError}</FieldError>
        </Field>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Enviando…' : 'Enviar link de recuperação'}
        </Button>
      </FieldGroup>
    </form>
  )
}
