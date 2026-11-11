import { expect, type Page } from '@playwright/test'
import { waitForOtp } from './mailbox'

export const password = 'senha1234'

let counter = 0

/** E-mail único por chamada (o contador evita colisão no mesmo milissegundo). */
export function uniqueEmail(tag: string) {
  counter += 1
  return `e2e-${tag}-${Date.now()}-${counter}@example.com`
}

/**
 * Cadastra a conta pelo formulário, confirma o e-mail com o OTP lido da caixa
 * fake (`E2E=true`) e deixa a página logada na home.
 */
export async function signUpAndLogin(page: Page, email: string, name = 'Maria Souza') {
  await page.goto('/signup')
  await page.getByLabel('Nome completo').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  const otp = await waitForOtp(email)
  await page.locator('input[autocomplete="one-time-code"]').fill(otp)
  await page.getByRole('button', { name: 'Confirmar e-mail' }).click()
  await expect(page).toHaveURL('/')
}
