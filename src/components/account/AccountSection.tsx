import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

// Cartão de uma seção da conta (Perfil, Trocar senha, Conta Google). É uma
// região nomeada pelo próprio título pra leitores de tela.
export function AccountSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card
      role="region"
      aria-labelledby={`${id}-title`}
      className="gap-6 rounded-2xl [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]"
    >
      <CardHeader className="gap-1.5">
        <h2 id={`${id}-title`} className="text-[1.375rem] leading-tight font-bold">
          {title}
        </h2>
        <CardDescription className="max-w-prose text-[0.9375rem] leading-normal">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
