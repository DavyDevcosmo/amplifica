import { describe, expect, test } from 'vitest'
import {
  brasiliaDayKey,
  currentMonthKey,
  dayOfMonth,
  daysInMonth,
  formatBrasiliaLongDate,
  formatBrasiliaShortDate,
  formatBrasiliaTime,
  monthBounds,
  monthKeyOf,
  monthLabel,
  monthsBetween,
  monthTitle,
  parseMonthKey,
  shiftMonth,
} from './brasiliaTime'

describe('brasiliaTime', () => {
  test('23h30 de 30/11 em Brasília é novembro', () => {
    expect(monthKeyOf(new Date('2026-12-01T02:30:00Z'))).toBe('2026-11')
    expect(dayOfMonth(new Date('2026-12-01T02:30:00Z'))).toBe(30)
    expect(brasiliaDayKey(new Date('2026-12-01T02:30:00Z'))).toBe('2026-11-30')
  })

  test('brasiliaDayKey com zero à esquerda', () => {
    expect(brasiliaDayKey(new Date('2026-12-07T15:00:00Z'))).toBe('2026-12-07')
  })

  test('currentMonthKey usa o relógio informado', () => {
    expect(currentMonthKey(new Date('2026-11-10T15:00:00Z'))).toBe('2026-11')
  })

  test('monthBounds de novembro', () => {
    expect(monthBounds('2026-11')).toEqual({
      start: new Date('2026-11-01T03:00:00Z'),
      end: new Date('2026-12-01T03:00:00Z'),
    })
  })

  test('monthBounds de dezembro termina em janeiro do ano seguinte', () => {
    expect(monthBounds('2026-12').end).toEqual(new Date('2027-01-01T03:00:00Z'))
  })

  test('parseMonthKey cai no mês atual quando inválido ou futuro', () => {
    const now = new Date('2026-11-10T15:00:00Z')
    expect(parseMonthKey('2026-10', now)).toBe('2026-10')
    expect(parseMonthKey('2030-01', now)).toBe('2026-11')
    expect(parseMonthKey('2026-13', now)).toBe('2026-11')
    expect(parseMonthKey(undefined, now)).toBe('2026-11')
  })

  test('parseMonthKey descarta meses antes de 2020', () => {
    const now = new Date('2026-11-10T15:00:00Z')
    expect(parseMonthKey('0000-01', now)).toBe('2026-11')
    expect(parseMonthKey('2019-12', now)).toBe('2026-11')
    expect(parseMonthKey('2020-01', now)).toBe('2020-01')
  })

  test('shiftMonth e monthsBetween atravessam o ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(monthsBetween('2025-11', '2026-02')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
  })

  test('daysInMonth', () => {
    expect(daysInMonth('2026-11')).toBe(30)
    expect(daysInMonth('2026-12')).toBe(31)
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
  })
})

describe('rótulos de data', () => {
  test('formatBrasiliaShortDate usa o dia de Brasília', () => {
    expect(formatBrasiliaShortDate(new Date('2026-12-09T14:00:00Z'), 'pt-BR')).toBe(
      '9 dez',
    )
    // 02h30 UTC de 10/12 ainda é 9/12 em Brasília
    expect(formatBrasiliaShortDate(new Date('2026-12-10T02:30:00Z'), 'pt-BR')).toBe(
      '9 dez',
    )
    expect(formatBrasiliaShortDate(new Date('2026-12-09T14:00:00Z'), 'en')).toBe(
      'Dec 9',
    )
  })

  test('formatBrasiliaLongDate escreve dia e mês por extenso', () => {
    expect(formatBrasiliaLongDate(new Date('2026-12-07T15:00:00Z'), 'pt-BR')).toBe(
      '7 de dezembro',
    )
    // 02h30 UTC de 8/12 ainda é 7/12 em Brasília
    expect(formatBrasiliaLongDate(new Date('2026-12-08T02:30:00Z'), 'pt-BR')).toBe(
      '7 de dezembro',
    )
    expect(formatBrasiliaLongDate(new Date('2026-12-07T15:00:00Z'), 'en')).toBe(
      'December 7',
    )
  })

  test('monthLabel devolve o nome do mês', () => {
    expect(monthLabel('2026-11', 'pt-BR')).toBe('novembro')
    expect(monthLabel('2026-11', 'en')).toBe('November')
  })

  test('monthTitle devolve mês e ano com inicial maiúscula', () => {
    expect(monthTitle('2026-11', 'pt-BR')).toBe('Novembro de 2026')
    expect(monthTitle('2026-11', 'en')).toBe('November 2026')
  })

  test('formatBrasiliaTime mostra a hora de Brasília em 24h', () => {
    expect(formatBrasiliaTime(new Date('2026-11-10T17:32:00Z'), 'pt-BR')).toBe('14:32')
    // 02h30 UTC de 10/11 ainda é 23h30 de 9/11 em Brasília
    expect(formatBrasiliaTime(new Date('2026-11-10T02:30:00Z'), 'en')).toBe('23:30')
    expect(formatBrasiliaTime(new Date('2026-11-10T03:05:00Z'), 'en')).toBe('00:05')
  })
})
