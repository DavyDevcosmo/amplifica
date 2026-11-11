// Classes repetidas pelas etapas do formulário (canvas NovoProduto).

export const CARD =
  'flex flex-col gap-4.5 rounded-[18px] bg-card p-4.5 md:gap-5 md:rounded-card md:p-7'

export const H2 = 'text-lg leading-6 font-bold'

export const SUB = 'text-sm leading-5 text-ardosia'

export const FIELD = 'flex flex-col gap-2'

export const LABEL = 'text-[0.8125rem] font-bold'

export const HELP = 'text-[0.8125rem] leading-[1.1875rem] text-ardosia'

export const INPUT =
  'h-12 rounded-xl border-[1.5px] border-ardosia/40 bg-card px-4 text-[0.9375rem] md:h-12 md:text-[0.9375rem] focus-visible:border-azul focus-visible:ring-2 focus-visible:ring-azul/40'

export const TEXTAREA =
  'rounded-xl border-[1.5px] border-ardosia/40 bg-card px-4 py-3 text-[0.9375rem] leading-[1.4375rem] md:text-[0.9375rem] focus-visible:border-azul focus-visible:ring-2 focus-visible:ring-azul/40'

export const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-azul focus-visible:ring-offset-2'

// Chip de seleção (estilo, tipo de captura). `on` deixa azul.
export function chipClass(on: boolean) {
  return [
    'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.8125rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
    FOCUS,
    on
      ? 'border-azul bg-azul/8 text-azul-forte dark:text-azul-claro'
      : 'border-ardosia/35 bg-card text-foreground hover:border-ardosia/60',
  ].join(' ')
}
