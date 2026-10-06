import { expect, test } from '@playwright/test'
import { budgets } from './budgets'
import { recordMetric } from './perfReport'

const ROUTES = ['/', '/login', '/signup'] as const

test.describe('performance de bundle e LCP', () => {
  for (const route of ROUTES) {
    test(`${route}: JS inicial (meta ${Math.round(budgets.jsBundleBytes / 1024)}KB) e LCP (meta ${budgets.lcpMs}ms)`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'networkidle' })

      // Resource Timing API, medida dentro da própria página — mais confiável
      // que somar bytes de um listener de `response` do Playwright (que pode
      // perder request cacheada/abortada). `transferSize` já é o tamanho
      // comprimido (o que trafega na rede), não o tamanho decodificado.
      const totalBytes = await page.evaluate(() => {
        const entries = performance.getEntriesByType(
          'resource',
        ) as PerformanceResourceTiming[]
        return entries
          .filter((entry) => entry.initiatorType === 'script')
          .reduce((sum, entry) => sum + entry.transferSize, 0)
      })

      // LCP via PerformanceObserver: o browser pode já ter descartado a
      // entrada se o observer for criado tarde demais, então cai pro
      // fallback de performance.getEntriesByType (mesma API, sem observer).
      const lcpMs = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const existing = performance.getEntriesByType(
              'largest-contentful-paint',
            ) as PerformanceEntry[]
            if (existing.length > 0) {
              resolve(existing[existing.length - 1].startTime)
              return
            }
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              if (entries.length > 0) {
                resolve(entries[entries.length - 1].startTime)
              }
            })
            observer.observe({ type: 'largest-contentful-paint', buffered: true })
            setTimeout(() => resolve(0), 2000)
          }),
      )

      const metricSuffix = route === '/' ? 'home' : route.replace('/', '')
      await recordMetric({
        name: `bundle:${metricSuffix}`,
        valueBytes: totalBytes,
        budget: budgets.jsBundleBytes,
        unit: 'bytes',
      })
      await recordMetric({
        name: `lcp:${metricSuffix}`,
        valueMs: lcpMs,
        budget: budgets.lcpMs,
        unit: 'ms',
      })

      expect(totalBytes, `JS inicial de ${route} excede o budget`).toBeLessThan(
        budgets.jsBundleBytes,
      )
      if (lcpMs > 0) {
        expect(lcpMs, `LCP de ${route} excede o budget`).toBeLessThan(budgets.lcpMs)
      }
    })
  }
})
