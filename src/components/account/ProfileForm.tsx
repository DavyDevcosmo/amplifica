'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfileAction } from '@/actions/userActions'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { updateProfileSchema } from '@/schemas/userSchema'

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string>()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = updateProfileSchema.safeParse({ name: value })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }
    setError(undefined)

    startTransition(async () => {
      const result = await updateProfileAction(parsed.data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Perfil atualizado')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
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
          {isPending ? 'Salvando…' : 'Salvar nome'}
        </Button>
      </FieldGroup>
    </form>
  )
}
