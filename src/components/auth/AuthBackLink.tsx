import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

// Saída das telas de recuperação e verificação: volta pro login. Fica sempre no
// canto superior esquerdo do cartão (o layout de auth é `relative`); a página
// que usa precisa reservar o espaço com `pt-11` pra não encostar no título.
export async function AuthBackLink({
  href = '/login',
  className,
}: {
  href?: string
  className?: string
}) {
  const t = await getTranslations('auth.shared')

  return (
    <p
      className={cn(
        'absolute top-1 left-4 text-[0.9375rem] lg:top-(--auth-panel-py) lg:left-10',
        className,
      )}
    >
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {t('backToLogin')}
      </Link>
    </p>
  )
}
