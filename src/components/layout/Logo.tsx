import { cn } from '@/lib/utils'

// Símbolo do Amplifica: duas lâminas cruzadas. Sobre fundo claro, marinho +
// azul; `inverse` (sobre noite, marinho ou preto) usa branco + azul-claro.
// `themed={false}`: cores fixas de fundo claro mesmo no tema escuro (ex.: o
// painel branco do cabeçalho flutuante da home).
export function LogoMark({
  inverse = false,
  themed = true,
  className,
}: {
  inverse?: boolean
  themed?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="14 26 92 78"
      aria-hidden
      focusable="false"
      className={cn('h-7 w-auto', className)}
    >
      <polygon
        points="18,100 40,100 72,30 50,30"
        className={
          inverse ? 'fill-white' : cn('fill-marinho', themed && 'dark:fill-white')
        }
      />
      <polygon
        points="102,100 80,100 48,30 70,30"
        className={
          inverse
            ? 'fill-azul-claro'
            : cn('fill-azul', themed && 'dark:fill-azul-claro')
        }
      />
    </svg>
  )
}

// Símbolo + wordmark em Archivo expandida. O texto é o nome da marca; o link
// que envolve o logo dá o aria-label.
export function Logo({
  inverse = false,
  themed = true,
  className,
}: {
  inverse?: boolean
  themed?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark inverse={inverse} themed={themed} className="h-6 lg:h-7" />
      <span className="font-display text-lg leading-none lg:text-[1.375rem]">
        Amplifica
      </span>
    </span>
  )
}
