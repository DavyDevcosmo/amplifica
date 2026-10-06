'use client'

import { LanguagesIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { setLocaleAction } from '@/actions/localeActions'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isLocale, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

const OPTIONS: ReadonlyArray<{ value: Locale; labelKey: 'ptBR' | 'en'; code: string }> =
  [
    { value: 'pt-BR', labelKey: 'ptBR', code: 'PT' },
    { value: 'en', labelKey: 'en', code: 'EN' },
  ]

// Troca o idioma: grava o cookie (action) e renderiza os Server Components de
// novo. O código do idioma atual (PT/EN) fica visível no botão.
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const current = OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0]

  function handleChange(next: string) {
    if (!isLocale(next) || next === locale) return
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t('label')}: ${t(current.labelKey)}`}
        disabled={isPending}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'lg' }),
          'gap-1.5 px-2.5 text-[0.8125rem] font-bold',
          className,
        )}
      >
        <LanguagesIcon aria-hidden className="size-5" />
        {current.code}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
            {OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                closeOnClick
                className="min-h-11"
              >
                {t(option.labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
