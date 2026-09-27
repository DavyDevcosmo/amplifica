'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { resetPasswordAction } from '@/actions/authActions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { resetPasswordSchema } from '@/schemas/authSchema'

export function ResetPasswordForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()
  const [done, setDone] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      const result = await resetPasswordAction(parsed.data)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setDone(true)
    })
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Link inválido ou expirado.{' '}
        <Link href="/senha/esqueci" className="underline underline-offset-4">
          Peça um novo
        </Link>
        .
      </p>
    )
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Senha redefinida com sucesso.</p>
        <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
          Entrar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirmar nova senha</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.confirmPassword}</FieldError>
        </Field>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Salvando…' : 'Redefinir senha'}
        </Button>
      </FieldGroup>
    </form>
  )
}
