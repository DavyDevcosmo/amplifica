import type { ReactNode } from 'react'

// Cabeçalho de página da área do vendedor: eyebrow azul, título grande e,
// à direita (ou embaixo no celular), as ações da página.
export function SellerPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="type-eyebrow text-azul">{eyebrow}</p>
        <h1 className="font-display text-[clamp(1.625rem,2.6vw,2.125rem)] leading-[1.05] text-marinho">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[0.9375rem] leading-[1.375rem] text-ardosia">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </header>
  )
}
