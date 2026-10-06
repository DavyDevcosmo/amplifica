import type { ReactNode } from 'react'

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 pb-2 text-center">
      <h1 className="text-(length:--auth-title-size) leading-[1.15]">{title}</h1>
      {description && (
        <p className="text-base leading-normal text-balance text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
