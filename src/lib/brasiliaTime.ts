// Mês e dia do Amplifica sempre no fuso de Brasília. O Brasil não tem horário
// de verão desde 2019, então o offset fixo -03:00 é seguro para os limites do
// mês; as partes de data de um instante vêm do Intl (fuso America/Sao_Paulo).
export type MonthKey = `${number}-${string}` // "2026-11"

const TIME_ZONE = 'America/Sao_Paulo'

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function brasiliaParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  }
}

function toKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, '0')}`
}

function splitKey(key: MonthKey) {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

export function monthKeyOf(date: Date): MonthKey {
  const { year, month } = brasiliaParts(date)
  return toKey(year, month)
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKeyOf(now)
}

// Nenhuma venda é anterior a isto; barra `?mes=0000-01`, que montaria milhares
// de meses no seletor.
const MIN_MONTH_YEAR = 2020

// Valor vindo da URL (?month=2026-10): inválido, futuro ou antes de 2020 cai
// no mês atual.
export function parseMonthKey(
  raw: string | undefined,
  now: Date = new Date(),
): MonthKey {
  const current = currentMonthKey(now)
  if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return current
  const key = raw as MonthKey
  if (splitKey(key).year < MIN_MONTH_YEAR) return current
  return key > current ? current : key
}

// Instantes UTC; `end` é exclusivo (primeiro instante do mês seguinte).
export function monthBounds(key: MonthKey): { start: Date; end: Date } {
  const next = shiftMonth(key, 1)
  return {
    start: new Date(`${key}-01T00:00:00-03:00`),
    end: new Date(`${next}-01T00:00:00-03:00`),
  }
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, month } = splitKey(key)
  const index = year * 12 + (month - 1) + delta
  return toKey(Math.floor(index / 12), (((index % 12) + 12) % 12) + 1)
}

// Inclusivo nas duas pontas, em ordem crescente.
export function monthsBetween(from: MonthKey, to: MonthKey): MonthKey[] {
  const months: MonthKey[] = []
  for (let key = from; key <= to; key = shiftMonth(key, 1)) months.push(key)
  return months
}

export function dayOfMonth(date: Date): number {
  return brasiliaParts(date).day
}

export function daysInMonth(key: MonthKey): number {
  const { year, month } = splitKey(key)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// "2026-12-07"
export function brasiliaDayKey(date: Date): string {
  const { year, month, day } = brasiliaParts(date)
  return `${toKey(year, month)}-${String(day).padStart(2, '0')}`
}

// "9 dez" (pt-BR) / "Dec 9" (en): dia e mês curtos de um instante, no dia de
// Brasília. Tira o ponto da abreviação ("dez." -> "dez").
export function formatBrasiliaShortDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
  })
    .formatToParts(date)
    .filter((part) => part.type === 'day' || part.type === 'month')
    .map((part) => part.value.replace(/\.$/, ''))
    .join(' ')
}

// "novembro" / "November": nome do mês por extenso.
export function monthLabel(key: MonthKey, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, month: 'long' }).format(
    monthBounds(key).start,
  )
}

// "Novembro de 2026" / "November 2026": mês e ano, inicial maiúscula.
export function monthTitle(key: MonthKey, locale: string): string {
  const text = new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(monthBounds(key).start)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "7 de dezembro" (pt-BR) / "December 7" (en): dia e mês por extenso, no dia
// de Brasília.
export function formatBrasiliaLongDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
  }).format(date)
}

// "14:32": hora de Brasília em 24h, igual nos dois idiomas.
export function formatBrasiliaTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}
