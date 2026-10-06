import { expect, test } from '@playwright/test'
import { clearMailbox, waitForOtp } from './helpers/mailbox'

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

  await page.goto('/signup')
  await page.getByLabel('Nome').fill('Guitarrista E2E')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha').fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/signup\/verify/)
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

  // a caixa fake guarda um arquivo por destinatário e sobrescreve: limpa antes
  // de pedir o código novo, pra não ler o OTP antigo do cadastro
  await clearMailbox()
  await page.goto('/password/forgot')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Enviar código' }).click()

  // passo 2: só o código. O e-mail fica no estado do fluxo, não na URL (sem ?token=)
  await expect(page).toHaveURL(/\/password\/code$/)
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Você tem 3 tentativas')).toBeVisible()
  await expect(page.getByRole('timer')).toContainText('O código expira em')

  // código errado: gasta uma tentativa e não avança
  await page.locator('input[autocomplete="one-time-code"]').fill('000000')
  await page.getByRole('button', { name: 'Verificar código' }).click()
  await expect(page.getByText('Você tem mais 2 tentativas')).toBeVisible()
  await expect(page).toHaveURL(/\/password\/code$/)

  // código certo: vai pro passo 3, onde se escolhe a nova senha
  const resetOtp = await waitForOtp(email)
  // o campo ainda está cheio com o '000000' errado: o input-otp trata um fill()
  // sobre valor completo como digitação (sobra só o 1º dígito do código novo),
  // então limpa antes
  const otpInput = page.locator('input[autocomplete="one-time-code"]')
  await otpInput.clear()
  await otpInput.fill(resetOtp)
  await page.getByRole('button', { name: 'Verificar código' }).click()
  await expect(page).toHaveURL(/\/password\/reset$/)
  await expect(page.locator('input[autocomplete="one-time-code"]')).toHaveCount(0)

  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirmar nova senha').fill(newPassword)
  await page.getByRole('button', { name: 'Redefinir senha' }).click()
  // depois de redefinir, o app leva pro login com o aviso de sucesso
  await expect(page).toHaveURL(/\/login\?senha=redefinida/)
  await expect(page.getByText('Senha redefinida.')).toBeVisible()
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
  await page.goto('/signup')
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
    await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  }

  // 6ª tentativa: bate o limiar de bloqueio (ver loginThrottleService)
  await page.getByLabel('Senha', { exact: true }).fill('senhaerrada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page.getByText(/Muitas tentativas\. Tente novamente em \d+ min\./),
  ).toBeVisible()
})

// Server Component assíncrono (lê searchParams) — o Vitest não renderiza, só
// o Playwright. Não grava nada no banco.
test('login: aviso "Senha redefinida." aparece só com ?senha=redefinida', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByText('Senha redefinida.')).toHaveCount(0)

  await page.goto('/login?senha=redefinida')
  await expect(
    page.getByRole('status').filter({ hasText: 'Senha redefinida.' }),
  ).toBeVisible()
  await expect(page.getByText('Faça login com sua nova senha.')).toBeVisible()
})

// No desktop, o header e o link de troca de tela renderizam "Entrar" /
// "Criar conta" ao mesmo tempo — escopar pelo landmark evita violação do
// strict mode e garante que o link de troca (dentro de <main>) funciona.
test('login <-> cadastro: link de troca de tela dentro de <main> navega', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('link', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/signup')

  await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/login')
})

test('rota protegida: /account/profile sem sessão manda pro login e volta depois', async ({
  page,
}) => {
  const email = uniqueEmail('protected')
  const password = 'senha1234'

  await page.goto('/account/profile')
  await expect(page).toHaveURL('/login?callbackUrl=%2Faccount%2Fprofile')

  await page.goto('/signup')
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
  // sem esperar a UI confirmar o logout, o goto abaixo pode disparar antes do
  // Set-Cookie que limpa a sessão chegar no browser — o navegador ainda leva
  // o cookie antigo (válido) pra essa próxima requisição, e o teste vira
  // falso negativo (a rota "protegida" aparenta não proteger nada).
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

  await page.goto('/account/profile')
  await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/account/profile')
})

// Os testes abaixo não gravam no banco: só leem páginas públicas e mexem no
// cookie NEXT_LOCALE / localStorage (tema) do próprio browser.

test('idioma: trocar para English muda o texto e o <html lang>, persiste no reload e volta para pt-BR', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()

  const header = page.getByRole('banner')
  await header.getByRole('button', { name: /^Idioma/ }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()

  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(header.getByRole('button', { name: /^Language/ })).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await header.getByRole('button', { name: /^Language/ }).click()
  await page.getByRole('menuitemradio', { name: 'Português (BR)' }).click()

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
})

test('tema: escolher escuro põe a classe dark no <html> e persiste no reload', async ({
  page,
}) => {
  await page.goto('/login')
  const header = page.getByRole('banner')
  await header.getByRole('button', { name: 'Tema' }).click()
  await page.getByRole('menuitemradio', { name: 'Escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
})

// O layout de auth ocupa no mínimo a viewport e, se o conteúdo não couber, quem
// rola é a página (o <main> do cartão não é um container de scroll).
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
]) {
  for (const route of ['/login', '/signup']) {
    test(`layout de auth: ${route} em ${viewport.width}x${viewport.height} cobre a viewport e o scroll é da página, não do cartão`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto(route)
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()

      const { scrollHeight, innerHeight } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      }))
      expect(scrollHeight).toBeGreaterThanOrEqual(innerHeight)

      const mainOverflow = await page
        .getByRole('main')
        .evaluate((el) => getComputedStyle(el).overflowY)
      expect(mainOverflow).toBe('visible')

      const box = await page.getByRole('banner').boundingBox()
      expect(box?.y).toBeGreaterThanOrEqual(0)
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height)
    })
  }
}

test('/password/reset sem estado (acesso direto) redireciona para /password/forgot', async ({
  page,
}) => {
  await page.goto('/password/reset')
  await expect(page).toHaveURL(/\/password\/forgot$/)
  await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible()
})

test('/password/code sem estado (acesso direto) redireciona para /password/forgot', async ({
  page,
}) => {
  await page.goto('/password/code')
  await expect(page).toHaveURL(/\/password\/forgot$/)
})
