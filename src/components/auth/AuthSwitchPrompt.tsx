import Link from 'next/link'
import { cn } from '@/lib/utils'

// Troca entre login e cadastro: texto com link, não botão.
export function AuthSwitchPrompt({
  prompt,
  href,
  action,
  className,
}: {
  prompt: string
  href: string
  action: string
  className?: string
}) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-1.5 text-[0.9375rem] text-muted-foreground',
        className,
      )}
    >
      {prompt}
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {action}
      </Link>
    </p>
  )
}
