import { expect, test } from '@playwright/test'
import { clearMailbox, waitForOtp, waitForResetLink } from './helpers/mailbox'

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}@example.com`
}

test.beforeAll(async () => {
  await clearMailbox()
})

test('cadastro completo: cria conta, verifica, loga, desloga, redefine a senha e loga com a nova', async ({
  page,
}) => {
  const email = uniqueEmail('signup')
  const password = 'senha1234'
  const newPassword = 'senhaNova1234'

  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Guitarrista E2E')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/cadastro\/verificar/)
  const otp = await waitForOtp(email)
  await page.locator('input[autocomplete="one-time-code"]').fill(otp)
  await page.getByRole('button', { name: 'Confirmar e-mail' }).click()

  // autoSignInAfterVerification: cai logado direto na home
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Menu do usuário' })).toBeVisible()

  // desloga
  await page.getByRole('button', { name: 'Menu do usuário' }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

  // loga de novo com a senha original
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')

  // desloga de novo pra testar o esqueci-a-senha
  await page.getByRole('button', { name: 'Menu do usuário' }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

  await page.goto('/senha/esqueci')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click()
  await expect(page.getByText(email, { exact: false })).toBeVisible()

  const resetLink = await waitForResetLink(email)
  await page.goto(resetLink)
  await expect(page).toHaveURL(/\/senha\/redefinir\?token=/)

  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirmar nova senha').fill(newPassword)
  await page.getByRole('button', { name: 'Redefinir senha' }).click()
  await expect(page.getByText('Senha redefinida com sucesso.')).toBeVisible()

  await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(newPassword)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
})

test('credencial errada: mostra erro e bloqueia depois de 5 tentativas', async ({
  page,
}) => {
  const email = uniqueEmail('lockout')
  const password = 'senha1234'

  // cadastra e verifica só pra ter uma conta de verdade pra tentar errar a senha
  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Alvo do Bloqueio')
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
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)

  // as primeiras 5 falhas retornam o erro normal — é só a partir da 6ª
  // tentativa que o loginThrottleService já registrou o bloqueio e barra a
  // requisição antes mesmo de checar a senha (ver loginThrottleService.ts)
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.getByLabel('Senha', { exact: true }).fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  }

  // 6ª tentativa: bate o limiar de bloqueio (ver loginThrottleService)
  await page.getByLabel('Senha', { exact: true }).fill('senhaerrada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page.getByText(/Muitas tentativas\. Tente novamente em \d+ min\./),
  ).toBeVisible()
})

test('rota protegida: /conta/perfil sem sessão manda pro login e volta depois', async ({
  page,
}) => {
  const email = uniqueEmail('protected')
  const password = 'senha1234'

  await page.goto('/conta/perfil')
  await expect(page).toHaveURL('/login?callbackUrl=%2Fconta%2Fperfil')

  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Rota Protegida')
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

  await page.goto('/conta/perfil')
  await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/conta/perfil')
})
