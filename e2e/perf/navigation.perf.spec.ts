import { expect, test } from '@playwright/test'
import { clearMailbox, waitForOtp } from '../helpers/mailbox'
import { budgets } from './budgets'
import { measureMedian } from './measure'
import { recordMetric } from './perfReport'

// Roda contra o build de produção (playwright.perf.config.ts), nunca `pnpm
// dev` — em dev cada rota compila sob demanda no primeiro acesso, o que
// mediria o compilador, não a navegação.

function uniqueEmail(tag: string) {
  return `e2e-perf-${tag}-${Date.now()}@example.com`
}

test.describe('performance de navegação', () => {
  const email = uniqueEmail('nav')
  const password = 'senha1234'

  test.beforeAll(async ({ browser }) => {
    await clearMailbox()
    // cria e verifica o usuário uma vez só — reaproveitado pelos 3 testes
    // abaixo, que fazem login/logout conforme precisam.
    const page = await browser.newPage()
    await page.goto('/signup')
    await page.getByLabel('Nome').fill('Perf Nav')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByLabel('Confirmar senha').fill(password)
    await page.getByRole('button', { name: 'Criar conta' }).click()
    const otp = await waitForOtp(email)
    await page.locator('input[autocomplete="one-time-code"]').fill(otp)
    await page.getByRole('button', { name: 'Confirmar e-mail' }).click()
    await expect(page).toHaveURL('/')
    await page.getByRole('button', { name: 'Menu do usuário' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await page.close()
  })

  test(`home → login (clique até o form visível, meta ${budgets.navigationMs}ms)`, async ({
    page,
  }) => {
    const valueMs = await measureMedian(async () => {
      await page.goto('/')
      await page.getByRole('link', { name: 'Entrar' }).click()
      await expect(page.getByLabel('E-mail')).toBeVisible()
    })

    await recordMetric({
      name: 'nav:home-to-login',
      valueMs,
      budget: budgets.navigationMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.navigationMs)
  })

  test(`login → home logado (submit até o menu do usuário visível, meta ${budgets.navigationMs}ms)`, async ({
    page,
  }) => {
    const valueMs = await measureMedian(
      async () => {
        await page.goto('/login')
        await page.getByLabel('E-mail').fill(email)
        await page.getByLabel('Senha', { exact: true }).fill(password)
        await page.getByRole('button', { name: 'Entrar' }).click()
        await expect(
          page.getByRole('button', { name: 'Menu do usuário' }),
        ).toBeVisible()
      },
      3,
      // desloga fora do bloco medido — senão a métrica mede login + logout
      // juntos, em vez de só a navegação login → home
      async () => {
        await page.getByRole('button', { name: 'Menu do usuário' }).click()
        await page.getByRole('menuitem', { name: 'Sair' }).click()
        await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
      },
    )

    await recordMetric({
      name: 'nav:login-to-home',
      valueMs,
      budget: budgets.navigationMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.navigationMs)
  })

  test(`perfil → home (navegação até o h1 visível, meta ${budgets.navigationMs}ms)`, async ({
    page,
  }) => {
    // precisa estar logado pra acessar /account/profile
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible()

    const valueMs = await measureMedian(async () => {
      await page.goto('/account/profile')
      // (customer)/layout.tsx não tem header/logo (só o guard de sessão) —
      // navega direto, em vez de clicar num link "Amplifica" que não existe
      // nessa rota.
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    await recordMetric({
      name: 'nav:profile-to-home',
      valueMs,
      budget: budgets.navigationMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.navigationMs)
  })
})
