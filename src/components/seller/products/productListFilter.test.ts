import { describe, expect, test } from 'vitest'
import type { SellerProductRow } from '@/server/queries/productQueries'
import {
  countByStatus,
  filterProducts,
  firstParam,
  normalizeSearch,
  parseSituacao,
  searchProducts,
} from './productListFilter'

const base: SellerProductRow = {
  id: '',
  title: '',
  kinds: ['PRESET'],
  kindOther: null,
  capturedAmp: null,
  priceCents: 0,
  salesCount: 0,
  status: 'draft',
  rejectionReason: null,
  coverUrl: null,
  updatedAt: new Date(0),
}
const products: SellerProductRow[] = [
  { ...base, id: '1', title: 'Clean Americano', status: 'published' },
  { ...base, id: '2', title: 'Rectifier 2 canais', status: 'draft' },
  { ...base, id: '3', title: 'IR 4x12 Greenback', status: 'rejected' },
  { ...base, id: '4', title: 'Clean ambient', status: 'review' },
]
const ids = (list: SellerProductRow[]) => list.map((product) => product.id)

describe('productListFilter', () => {
  test('normalizeSearch ignora acento, caixa e espaços nas pontas', () => {
    expect(normalizeSearch('  AMÉRICANO ')).toBe('americano')
  })

  test('parseSituacao aceita só situações conhecidas', () => {
    expect(parseSituacao('review')).toBe('review')
    expect(parseSituacao('all')).toBe('all')
    expect(parseSituacao('xyz')).toBe('all')
    expect(parseSituacao(undefined)).toBe('all')
  })

  test('firstParam pega o primeiro valor de parâmetro repetido', () => {
    expect(firstParam(['a', 'b'])).toBe('a')
    expect(firstParam('clean')).toBe('clean')
    expect(firstParam([])).toBeUndefined()
    expect(firstParam(undefined)).toBeUndefined()
  })

  test('busca por nome sem acento; vazio devolve tudo', () => {
    expect(ids(searchProducts(products, 'americano'))).toEqual(['1'])
    expect(ids(searchProducts(products, 'CLEAN'))).toEqual(['1', '4'])
    expect(ids(searchProducts(products, '   '))).toEqual(['1', '2', '3', '4'])
    expect(ids(searchProducts(products, undefined))).toEqual(['1', '2', '3', '4'])
  })

  test('filtra por situação', () => {
    expect(ids(filterProducts(products, 'rejected'))).toEqual(['3'])
    expect(ids(filterProducts(products, 'all'))).toEqual(['1', '2', '3', '4'])
  })

  test('conta por situação com total em all', () => {
    expect(countByStatus(products)).toEqual({
      all: 4,
      published: 1,
      review: 1,
      draft: 1,
      rejected: 1,
    })
    expect(countByStatus([])).toEqual({
      all: 0,
      published: 0,
      review: 0,
      draft: 0,
      rejected: 0,
    })
  })
})
