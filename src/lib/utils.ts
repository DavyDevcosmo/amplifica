export { cn } from 'cn'

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
// Valor em centavos (Int) -> "R$ 49,90". A moeda é sempre real; o `locale`
// só muda a pontuação. `wholeReais` tira os centavos (ex.: "R$ 1.148").
export function formatCurrency(
  cents: number,
  {
    locale = 'pt-BR',
    wholeReais = false,
  }: { locale?: string; wholeReais?: boolean } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: wholeReais ? 0 : 2,
    maximumFractionDigits: wholeReais ? 0 : 2,
  }).format(cents / 100)
}

// Tamanho de arquivo: 49152 -> "48 KB", 2202009 -> "2,1 MB" (base 1024).
export function formatFileSize(bytes: number, locale = 'pt-BR'): string {
  const MB = 1024 * 1024
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  const mb = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    bytes / MB,
  )
  return `${mb} MB`
}

export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value) return '/'
  // navegadores ignoram tab/CR/LF ao normalizar uma URL relativa — sem tirar
  // isso antes, "/\t/evil.com" não bate no filtro abaixo mas vira "//evil.com"
  // depois de parseado, um bypass conhecido de deny-list de open redirect.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: remover caractere de controle é o próprio ponto do filtro
  const cleaned = value.replace(/[\u0000-\u001f]/g, '')
  if (!cleaned.startsWith('/')) return '/'
  if (cleaned.startsWith('//') || cleaned.startsWith('/\\')) return '/'
  return cleaned
}

// "Plexi 68 — Helix  Ação!" -> "plexi-68-helix-acao"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
