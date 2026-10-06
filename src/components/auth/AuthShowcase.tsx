import { CheckIcon, PlayIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LogoMark } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'

// Painel lateral das telas de auth (xl+). Puramente ilustrativo: mostra o que
// o Amplifica entrega (preview em áudio, compatibilidade com pedaleira, downloads
// das compras) com formas no lugar de nome, vendedor e preço, porque ainda não
// há produto real pra exibir. Trocar as formas por dados reais quando o
// catálogo existir.

const WAVE_BARS = Array.from({ length: 30 }, (_, index) => {
  const swell = Math.sin((index / 29) * Math.PI) ** 0.6
  const grit = Math.abs(Math.sin(index * 1.7) * Math.cos(index * 0.6))
  return {
    id: `wave-${index}`,
    height: Math.round(12 + 88 * swell * (0.35 + 0.65 * grit)),
  }
})

const PEDALBOARDS = ['Helix', 'Kemper', 'Quad Cortex', 'ToneX', 'IR']

// Linha de texto ilustrativa (no lugar de um nome ou valor).
function Line({ className }: { className?: string }) {
  return <span className={cn('block h-2.5 rounded-full bg-foreground/15', className)} />
}

const cardClass =
  'absolute flex flex-col gap-3 rounded-2xl border border-white/50 bg-card p-4.5 text-card-foreground shadow-float dark:border-white/15'

export async function AuthShowcase() {
  const t = await getTranslations('showcase')

  return (
    <aside
      aria-hidden
      className="relative hidden min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-showcase px-10 pt-(--showcase-py) pb-(--showcase-pb) text-player-foreground xl:flex"
    >
      <div className="absolute inset-0 bg-showcase-grid" />

      <div className="relative h-[calc(25rem*var(--showcase-scale))] shrink-0 w-[calc(37.5rem*var(--showcase-scale))] max-w-full">
        <div className="absolute top-0 left-0 h-100 w-150 origin-top-left scale-(--showcase-scale)">
          <div className={cn(cardClass, 'top-0 left-0 w-77.5')}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">{t('featured')}</span>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                Helix
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <PlayIcon className="size-4 fill-current" />
              </span>
              <div className="flex h-9 flex-1 items-center justify-between">
                {WAVE_BARS.map((bar) => (
                  <span
                    key={bar.id}
                    className="w-1 rounded-full bg-primary"
                    style={{ height: `${bar.height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <Line className="w-28 bg-foreground/25" />
                <Line className="w-16" />
              </div>
              <Line className="w-12 bg-foreground/25" />
            </div>
          </div>

          <div className={cn(cardClass, 'top-17.5 right-0 w-67.5')}>
            <span className="text-[13px] font-bold">{t('compatible')}</span>
            <div className="flex flex-wrap gap-2">
              {PEDALBOARDS.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-border bg-field px-2.5 py-1 text-xs font-semibold"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-2.5">
              <CheckIcon className="size-4.5 text-primary" />
              <span className="text-[13px] text-muted-foreground">
                {t('audioPreview')}
              </span>
            </div>
          </div>

          <div className={cn(cardClass, 'top-57.5 left-10 w-82.5 gap-1.5 pb-2')}>
            <span className="pb-1.5 text-[13px] font-bold">{t('purchases')}</span>
            {[0, 1].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-2.5 border-t border-border py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-8 shrink-0 rounded-lg bg-linear-to-br from-player-progress to-primary" />
                  <div className="flex flex-col gap-1.5">
                    <Line className="w-24 bg-foreground/25" />
                    <Line className="w-14" />
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">{t('download')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-(--showcase-gap) flex size-18 items-center justify-center rounded-[1.25rem] border border-white/25 bg-primary">
        <LogoMark inverse className="h-8.5" />
      </div>

      <h2 className="relative mt-[calc(var(--showcase-gap)/2)] max-w-130 text-center text-[2rem] leading-[1.2] text-balance text-player-foreground">
        {t('headline')}
      </h2>
      <p className="relative mt-3 max-w-120 text-center text-base leading-relaxed text-balance text-player-muted">
        {t('description')}
      </p>

      <div className="absolute inset-x-10 bottom-8 flex gap-2.5">
        <span className="h-1.25 flex-2 rounded-full bg-player-foreground" />
        <span className="h-1.25 flex-1 rounded-full bg-white/35" />
        <span className="h-1.25 flex-1 rounded-full bg-white/20" />
        <span className="h-1.25 flex-1 rounded-full bg-white/20" />
      </div>
    </aside>
  )
}
