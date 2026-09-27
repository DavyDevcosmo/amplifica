'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { signInAction } from '@/actions/authActions'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCountdown } from '@/hooks/useCountdown'
import { safeCallbackUrl } from '@/lib/utils'
import { signInSchema } from '@/schemas/authSchema'
import { useAuthFlowStore } from '@/stores/authFlowStore'

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [formError, setFormError] = useState<string>()

  const lockedUntil = useAuthFlowStore((state) => state.lockedUntil)
  const setLockedUntil = useAuthFlowStore((state) => state.setLockedUntil)
  const setPendingEmail = useAuthFlowStore((state) => state.setPendingEmail)
  const setResendAvailableAt = useAuthFlowStore((state) => state.setResendAvailableAt)
  const lockedSecondsLeft = useCountdown(lockedUntil)
  const isLocked = lockedSecondsLeft > 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(undefined)

    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)

    startTransition(async () => {
      const result = await signInAction(parsed.data)
      if (!result.success) {
        // a mensagem já vem pronta em pt-BR — se for bloqueio, guarda um
        // horário aproximado só pra manter a mensagem visível entre re-renders
        if (result.error.toLowerCase().includes('tente novamente em')) {
          const minutes = Number(result.error.match(/(\d+)\s*min/)?.[1] ?? 1)
          setLockedUntil(Date.now() + minutes * 60_000)
        }
        setFormError(result.error)
        return
      }
      if (result.data.status === 'needsVerification') {
        setPendingEmail(email)
        // o Better Auth já reenviou o código sozinho (sendOnSignIn) — o
        // cooldown de reenvio local também precisa começar a contar agora
        setResendAvailableAt(Date.now() + 60_000)
        router.push(
          `/cadastro/verificar?callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`,
        )
        return
      }
      router.push(safeCallbackUrl(callbackUrl))
      router.refresh()
    })
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
            disabled={isPending || isLocked}
            required
          />
        </Field>
        <Field data-invalid={!!fieldError}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              href="/senha/esqueci"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending || isLocked}
            required
          />
          <FieldError>{fieldError}</FieldError>
        </Field>

        {isLocked ? (
          <p className="text-sm text-destructive">
            Muitas tentativas. Tente novamente em {Math.ceil(lockedSecondsLeft / 60)}{' '}
            min.
          </p>
        ) : (
          formError && <p className="text-sm text-destructive">{formError}</p>
        )}

        <Button type="submit" disabled={isPending || isLocked} className="w-full">
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </FieldGroup>
    </form>
  )
}
