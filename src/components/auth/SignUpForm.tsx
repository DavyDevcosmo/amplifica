'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { signUpAction } from '@/actions/authActions'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { signUpSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function SignUpForm() {
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

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = signUpSchema.safeParse(values)
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
      const result = await signUpAction(parsed.data)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setPendingEmail(result.data.email)
      setResendAvailableAt(Date.now() + 60_000)
      router.push('/cadastro/verificar')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!fieldErrors.name}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.name}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => update('password', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError>{fieldErrors.confirmPassword}</FieldError>
        </Field>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </FieldGroup>
    </form>
  )
}
