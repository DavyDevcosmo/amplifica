import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

const envE2ePath = path.resolve(__dirname, '.env.e2e')

// `dotenv` falha em silêncio se o arquivo não existir — sem essa checagem,
// os testes cairiam no DATABASE_URL de .env (banco de dev/produção) e
// e2e/auth.spec.ts criaria/apagaria contas de verdade nele.
if (!existsSync(envE2ePath)) {
  throw new Error(
    '.env.e2e não encontrado. Copie .env.e2e.example para .env.e2e e aponte ' +
      'pra uma branch Neon dedicada de teste antes de rodar os testes E2E.',
  )
}

loadEnv({ path: envE2ePath })

export default defineConfig({
  testDir: './e2e',
  // e2e/perf/*.perf.spec.ts só roda via playwright.perf.config.ts, contra
  // build de produção — sem isso, esse config pegaria os specs de perf
  // também e mediria contra `pnpm dev` (bundle maior, número sem sentido).
  testIgnore: '**/perf/**',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  // timeout um pouco mais folgado que o padrão: o banco de dev (Neon) não é
  // uma branch dedicada de E2E, então às vezes tem uma latência extra de
  // cold start que o padrão de 5s não perdoa.
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: process.env as Record<string, string>,
  },
})
