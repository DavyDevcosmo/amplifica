'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', icon: SunIcon },
  { value: 'dark', icon: MoonIcon },
  { value: 'system', icon: MonitorIcon },
] as const

// Claro / escuro / sistema. O ícone do botão troca por CSS (classe `dark` no
// <html>, posta pelo next-themes antes da pintura), então não há flash nem
// diferença entre servidor e cliente.
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme')
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('label')}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-lg' }),
          'relative',
          className,
        )}
      >
        <SunIcon aria-hidden className="size-5 dark:hidden" />
        <MoonIcon aria-hidden className="hidden size-5 dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
            {OPTIONS.map(({ value, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                closeOnClick
                className="min-h-11"
              >
                <Icon aria-hidden />
                {t(value)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
