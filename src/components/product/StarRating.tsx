import { cn } from '@/lib/utils'

const STAR_PATH =
  'M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z'

// Cinco estrelas em traço: cheias até a nota inteira; a estrela da fração
// (ex.: 4,8) fica em tom secundário. Decorativo: quem usa dá o texto da nota
// (aria-label ou texto visível).
export function StarRating({
  rating,
  className,
  starClassName = 'size-4',
}: {
  rating: number
  className?: string
  starClassName?: string
}) {
  const full = Math.floor(rating)
  const partial = rating - full > 0

  return (
    <span aria-hidden className={cn('inline-flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 24 24" aria-hidden className={starClassName}>
          <path
            d={STAR_PATH}
            strokeWidth="1.5"
            strokeLinejoin="round"
            className={cn(
              'stroke-azul',
              star <= full
                ? 'fill-azul'
                : star === full + 1 && partial
                  ? 'fill-azul/35'
                  : 'fill-transparent',
            )}
          />
        </svg>
      ))}
    </span>
  )
}
