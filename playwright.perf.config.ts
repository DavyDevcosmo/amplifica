import { existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

const envE2ePath = path.resolve(__dirname, '.env.e2e')

// `dotenv` falha em silêncio se o arquivo não existir — sem essa checagem,
// os testes de perf cairiam no DATABASE_URL de .env (banco de dev/produção)
// e mediriam (e sujariam) o banco errado.
if (!existsSync(envE2ePath)) {
  throw new Error(
    '.env.e2e não encontrado. Copie .env.e2e.example para .env.e2e e aponte ' +
      'pra uma branch Neon dedicada de teste antes de rodar pnpm test:perf.',
  )
}

loadEnv({ path: envE2ePath })

// Config separada do playwright.config.ts (E2E funcional): performance só
// faz sentido medida contra o build de produção — o `pnpm dev` compila cada
// rota sob demanda no primeiro acesso, o que distorceria qualquer número.
export default defineConfig({
  testDir: './e2e/perf',
  testMatch: '**/*.perf.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: process.env as Record<string, string>,
  },
})
