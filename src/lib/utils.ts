export { cn } from 'cn'

/**
 * Só aceita um caminho relativo que comece com "/" e não seja um protocolo
 * relativo disfarçado ("//evil.com" ou "/\evil.com", que o navegador trata
 * como "//evil.com"). Qualquer outra coisa vira "/" — evita open redirect em
 * `callbackUrl` vindo de query string.
 */
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
