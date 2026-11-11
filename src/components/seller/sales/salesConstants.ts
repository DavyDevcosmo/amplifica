// Valor do filtro de produto que significa "sem filtro".
export const ALL_PRODUCTS = 'all'

// Cores dos produtos no gráfico, na ordem dos mais vendidos. Do 5º em diante
// todos dividem a última cor (a ardósia do tema).
const PRODUCT_COLORS = ['#2563eb', '#1c3352', '#80a0c5', '#c6ab95'] as const
const OVERFLOW_COLOR = '#516d8d'

export function productColor(index: number): string {
  return PRODUCT_COLORS[index] ?? OVERFLOW_COLOR
}
