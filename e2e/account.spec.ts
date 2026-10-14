import { expect, test } from '@playwright/test'
import { clearMailbox, waitForEmail, waitForOtp } from './helpers/mailbox'

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}@example.com`
}

const password = 'senha1234'

test.beforeAll(async () => {
  await clearMailbox()
})

async function signUpAndLogin(page: import('@playwright/test').Page, email: string) {
  await page.goto('/signup')
  await page.getByLabel('Nome completo').fill('Maria Souza')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  const otp = await waitForOtp(email)
  await page.locator('input[autocomplete="one-time-code"]').fill(otp)
  await page.getByRole('button', { name: 'Confirmar e-mail' }).click()
  await expect(page).toHaveURL('/')
}

test('conta: perfil e segurança, com menu entre as duas telas', async ({ page }) => {
  const email = uniqueEmail('account')
  await signUpAndLogin(page, email)

  // --- Perfil ---
  await page.goto('/account/profile')
  const nav = page.getByRole('navigation', { name: 'Conta' })
  await expect(nav.getByRole('link', { name: 'Perfil' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByLabel('E-mail')).toBeDisabled()

  const save = page.getByRole('button', { name: 'Salvar alterações' })
  await expect(save).toBeDisabled()

  // nome de uma palavra: erro inline, sem apagar o que foi digitado
  const nameField = page.getByLabel('Nome completo')
  await nameField.fill('Maria')
  await save.click()
  await expect(
    page.getByText('Digite nome e sobrenome (pelo menos 2 palavras).'),
  ).toBeVisible()
  await expect(nameField).toHaveValue('Maria')

  // nome válido: aviso e nome novo na tela, sem recarregar a página
  await nameField.fill('Maria Souza Lima')
  await save.click()
  await expect(page.getByText('Perfil atualizado').last()).toBeVisible()
  await expect(
    page.getByRole('main').getByText('Maria Souza Lima', { exact: true }),
  ).toBeVisible()

  // --- Segurança ---
  await nav.getByRole('link', { name: 'Segurança' }).click()
  await expect(page).toHaveURL('/account/security')

  const change = page.getByRole('button', { name: 'Alterar senha' })
  const newPassword = 'senhaNova1234'

  // senha atual incorreta: mensagem inline no campo
  await page.getByLabel('Senha atual').fill('senhaErrada99')
  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirmar nova senha').fill(newPassword)
  await change.click()
  await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
  await expect(page.getByLabel('Senha atual')).toHaveAttribute('aria-invalid', 'true')

  // senha atual correta: aviso, campos limpos e e-mail "Sua senha foi alterada"
  await clearMailbox()
  await page.getByLabel('Senha atual').fill(password)
  await change.click()
  await expect(page.getByText('Senha alterada', { exact: true }).last()).toBeVisible()
  await expect(page.getByLabel('Senha atual')).toHaveValue('')
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('')

  const mail = await waitForEmail(email)
  expect(mail.subject).toContain('Sua senha foi alterada')

  // a sessão atual continua ativa
  await page.reload()
  await expect(page).toHaveURL('/account/security')
})

test('conta: sem sessão, /account/security manda pro login e volta depois', async ({
  page,
}) => {
  await page.goto('/account/security')
  await expect(page).toHaveURL('/login?callbackUrl=%2Faccount%2Fsecurity')
})
