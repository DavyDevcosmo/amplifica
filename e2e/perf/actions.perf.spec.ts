import { expect, type Page, test } from '@playwright/test'
import { clearMailbox, waitForOtp } from '../helpers/mailbox'
import { budgets } from './budgets'
import { measureMedian } from './measure'
import { recordMetric } from './perfReport'

// Mede o tempo de resposta das server actions (submit → resposta), não o
// tempo até a UI terminar de re-renderizar. As actions do projeto (ver
// src/actions/*) são Next.js Server Actions "puras" — o form as chama
// diretamente, sem passar por uma API Route — e por isso aparecem como um
// POST pra própria URL da página, com o header `Next-Action`.
async function waitForActionResponse(page: Page, trigger: () => Promise<void>) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && Boolean(res.ok() || res.status() < 500),
    ),
    trigger(),
  ])
  return response
}

function uniqueEmail(tag: string) {
  return `e2e-perf-${tag}-${Date.now()}@example.com`
}

test.describe('performance de actions', () => {
  const email = uniqueEmail('action')
  const password = 'senha1234'

  test.beforeAll(async ({ browser }) => {
    await clearMailbox()
    const page = await browser.newPage()
    await page.goto('/signup')
    await page.getByLabel('Nome').fill('Perf Action')
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

  test(`signInAction (meta ${budgets.actionMs}ms)`, async ({ page }) => {
    const valueMs = await measureMedian(
      async () => {
        await page.goto('/login')
        await page.getByLabel('E-mail').fill(email)
        await page.getByLabel('Senha', { exact: true }).fill(password)
        await waitForActionResponse(page, () =>
          page.getByRole('button', { name: 'Entrar' }).click(),
        )
        await expect(
          page.getByRole('button', { name: 'Menu do usuário' }),
        ).toBeVisible()
      },
      3,
      // desloga fora do bloco medido — senão a métrica mede login + logout
      // juntos, inflando o número que devia refletir só o signInAction
      async () => {
        await page.getByRole('button', { name: 'Menu do usuário' }).click()
        await page.getByRole('menuitem', { name: 'Sair' }).click()
        await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
      },
    )

    await recordMetric({
      name: 'action:sign-in',
      valueMs,
      budget: budgets.actionMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.actionMs)
  })

  test(`updateProfileAction (meta ${budgets.actionMs}ms)`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible()
    await page.goto('/account/profile')

    let counter = 0
    const valueMs = await measureMedian(async () => {
      counter += 1
      const name = `Perf Action ${counter}`
      await page.getByLabel('Nome').fill(name)
      const response = await waitForActionResponse(page, () =>
        page.getByRole('button', { name: 'Salvar nome' }).click(),
      )
      expect(response.ok()).toBe(true)
      // o sonner empilha um toast por iteração sem remover o anterior a
      // tempo — `.last()` pega sempre o mais recente, evitando "resolved to
      // N elements" no modo estrito do Playwright
      await expect(page.getByText('Perfil atualizado').last()).toBeVisible()
    }, 3)

    await recordMetric({
      name: 'action:update-profile',
      valueMs,
      budget: budgets.actionMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.actionMs)
  })

  test(`changePasswordAction (meta ${budgets.actionMs}ms)`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible()
    await page.goto('/account/profile')

    let currentPassword = password
    const valueMs = await measureMedian(async () => {
      const newPassword = `${password}${Date.now()}`
      await page.getByLabel('Senha atual').fill(currentPassword)
      await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
      await page.getByLabel('Confirmar nova senha').fill(newPassword)
      const response = await waitForActionResponse(page, () =>
        page.getByRole('button', { name: 'Alterar senha' }).click(),
      )
      expect(response.ok()).toBe(true)
      await expect(
        page.getByText('Senha alterada.', { exact: false }).last(),
      ).toBeVisible()
      currentPassword = newPassword
    }, 3)

    await recordMetric({
      name: 'action:change-password',
      valueMs,
      budget: budgets.actionMs,
      unit: 'ms',
    })
    expect(valueMs).toBeLessThan(budgets.actionMs)
  })
})
