import { cn } from '@/lib/utils'

// x, y1, y2 de cada barra da forma de onda.
const STRIPES: ReadonlyArray<readonly [number, number, number]> = [
  [51, 87, 93],
  [55.5, 84, 96],
  [60, 81, 99],
  [64.5, 84, 96],
  [69, 87, 93],
]

// Símbolo do Amplifica: duas lâminas cruzadas e cinco barras de forma de onda.
// Cores por token, então acompanha o tema claro/escuro sem arquivo separado.
// `inverse` é para uso sobre fundo primário (ícone do app).
export function LogoMark({
  inverse = false,
  className,
}: {
  inverse?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="14 26 92 78"
      aria-hidden
      focusable="false"
      className={cn('h-7.5 w-auto', className)}
    >
      <polygon
        points="18,100 40,100 72,30 50,30"
        className={inverse ? 'fill-white' : 'fill-foreground'}
      />
      <polygon
        points="102,100 80,100 48,30 70,30"
        opacity="0.9"
        className={inverse ? 'fill-player-bg' : 'fill-chart-4'}
      />
      {STRIPES.map(([x, y1, y2]) => (
        <line
          key={x}
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          strokeWidth="2.8"
          strokeLinecap="round"
          className={inverse ? 'stroke-white' : 'stroke-primary'}
        />
      ))}
    </svg>
  )
}

// Símbolo + wordmark. O texto é o nome da marca; o link que envolve o logo
// dá o aria-label.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.25', className)}>
      <LogoMark />
      <span className="font-wordmark text-2xl leading-none font-extrabold tracking-[-0.04em] lg:text-[1.75rem]">
        amplifica
      </span>
    </span>
  )
}
