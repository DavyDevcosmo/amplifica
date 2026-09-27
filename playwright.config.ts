import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(__dirname, '.env.e2e') })

export default defineConfig({
  testDir: './e2e',
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
