import { getTranslations } from 'next-intl/server'
import { GoogleIcon } from '@/components/auth/ProviderIcons'
import { Badge } from '@/components/ui/badge'

// Só leitura: mostra se há login Google vinculado à conta.
export async function GoogleAccountStatus({ linked }: { linked: boolean }) {
  const t = await getTranslations('account.security.google')

  return (
    <div className="flex items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5">
      <GoogleIcon className="size-5" />
      <span className="flex-1 text-[0.9375rem] font-semibold">{t('name')}</span>
      <Badge variant={linked ? 'default' : 'outline'} className="h-7 px-3 text-[13px]">
        {linked ? t('linked') : t('notLinked')}
      </Badge>
    </div>
  )
}
