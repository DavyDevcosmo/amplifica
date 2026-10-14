export { cn } from 'cn'

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
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
