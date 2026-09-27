import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* glow sutil atrás do card — o "sinal aceso" do amplificador, não um
          spotlight genérico de landing page */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/20 blur-[120px] dark:bg-primary/15"
      />
      <Link
        href="/"
        className="relative mb-10 flex items-center gap-2 font-heading text-xl font-medium tracking-tight"
      >
        <span className="size-2.5 rounded-full bg-primary" aria-hidden />
        Amplifica
      </Link>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  )
}
