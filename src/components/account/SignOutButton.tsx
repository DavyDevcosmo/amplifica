'use client'

import { LogOutIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { signOutAction } from '@/actions/authActions'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function SignOutButton() {
  const t = useTranslations('nav')
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="destructive"
      size="lg"
      disabled={isPending}
      className="h-12 w-fit bg-destructive px-6 font-bold text-primary-foreground hover:bg-destructive/90"
      onClick={() => startTransition(() => signOutAction())}
    >
      {isPending ? <Spinner aria-hidden /> : <LogOutIcon aria-hidden />}
      {t('signOut')}
    </Button>
  )
}
