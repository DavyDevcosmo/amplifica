'use client'

import { Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { GoogleIcon } from '@/components/auth/ProviderIcons'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/authClient'
import { cn, safeCallbackUrl } from '@/lib/utils'

// Só o Google está configurado no backend (auth.ts).
export function SocialSignIn({
  callbackUrl,
  className,
}: {
  callbackUrl?: string
  className?: string
}) {
  const t = useTranslations('auth.social')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  // Voltar pelo histórico (bfcache) depois de ir ao provedor restaura a página
  // com o botão ainda em "carregando" — destrava ao reaparecer.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) setPending(false)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  async function handleClick() {
    setPending(true)
    setError(undefined)
    // Em caso de sucesso o navegador é redirecionado pro provedor, então o
    // botão fica em "carregando" até a página trocar. Só destrava se a chamada
    // falhar antes do redirect (erro de rede ou provedor não configurado).
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: safeCallbackUrl(callbackUrl),
      })
      if (authError) throw authError
    } catch {
      setError(t('error'))
      setPending(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-(--auth-gap)', className)}>
      <div className="flex items-center gap-3.5">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">{t('divider')}</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="xl"
        className="h-(--auth-control-h) w-full text-[0.9375rem] font-semibold"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? (
          <Loader2Icon className="size-5 motion-safe:animate-spin" aria-hidden />
        ) : (
          <GoogleIcon />
        )}
        {t('google')}
      </Button>

      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
