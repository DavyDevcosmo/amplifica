import { cn } from '@/lib/utils'

const TONES = {
  // Escudo marinho com contorno e captador areia (card, produto, vender).
  areia: {
    shield: 'fill-marinho stroke-areia',
    accent: 'stroke-areia',
    core: 'fill-areia',
  },
  // Escudo marinho com captador azul-bebê, sobre o quadrado azul-bebê da
  // chamada do Programa Fundador na home.
  bebe: {
    shield: 'fill-marinho stroke-marinho',
    accent: 'stroke-azul-bebe',
    core: 'fill-azul-bebe',
  },
} as const

// Selo do Programa Fundador: escudo com um captador de três polos.
// Sem `label`, é decorativo (aria-hidden).
export function FounderSeal({
  label,
  tone = 'areia',
  className,
}: {
  label?: string
  tone?: keyof typeof TONES
  className?: string
}) {
  const colors = TONES[tone]
  const shape = (
    <>
      <path
        d="M12 2.2c4.9 0 8.6 2 8.6 5.5 0 4.6-4.7 10.1-8.6 13.8C8.1 17.8 3.4 12.3 3.4 7.7c0-3.5 3.7-5.5 8.6-5.5z"
        className={colors.shield}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <g className={colors.accent} strokeWidth="0.9" strokeLinecap="round">
        <path d="M10.2 3.4v3.4M12 2.9v3.9M13.8 3.4v3.4" />
      </g>
      <circle cx="12" cy="10.6" r="3.9" className={colors.core} />
      <g className="stroke-marinho" strokeWidth="0.9" strokeLinecap="round">
        <path d="M10.2 7.4v6.4M12 6.9v7.4M13.8 7.4v6.4" />
      </g>
    </>
  )

  return label ? (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className={cn('size-12', className)}
    >
      {shape}
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-12', className)}>
      {shape}
    </svg>
  )
}
