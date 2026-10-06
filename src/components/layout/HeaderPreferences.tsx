import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'

// Tema e idioma: os dois botões de preferência de todo cabeçalho.
export function HeaderPreferences({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  )
}
