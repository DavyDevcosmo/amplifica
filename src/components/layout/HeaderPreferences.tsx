import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'

// Cor dos botões por superfície. O `!` vence o `hover:text-foreground` do
// variant ghost, que no escuro deixaria o ícone branco sobre o painel branco.
const TONE_CLASS = {
  // segue o tema (fundo da página)
  auto: '',
  // sobre marinho/preto, nos dois temas
  onDark: 'text-white! hover:bg-white/10! hover:text-white!',
  // sobre o painel branco do cabeçalho flutuante, nos dois temas
  onLight: 'text-preto! hover:bg-creme! hover:text-preto!',
} as const

// Tema e idioma: os dois botões de preferência de todo cabeçalho.
export function HeaderPreferences({
  tone = 'auto',
  className,
}: {
  tone?: keyof typeof TONE_CLASS
  className?: string
}) {
  return (
    <div className={cn('flex items-center', className)}>
      <ThemeToggle className={TONE_CLASS[tone]} />
      <LanguageSwitcher className={TONE_CLASS[tone]} />
    </div>
  )
}
