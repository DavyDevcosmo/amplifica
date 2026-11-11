import { expect, type Page, test } from '@playwright/test'
import { clearMailbox } from './helpers/mailbox'
import { signUpAndLogin, uniqueEmail } from './helpers/session'

// Área do vendedor (/becomeSeller e /seller/*). Cada teste cria a própria
// conta; os e-mails ficam na caixa fake (E2E=true) e nada vai para o Resend.
// Upload de arquivo de produto: ver o último teste (precisa de R2 real).

const PRODUCT_URL = /\/seller\/products\/([^/?]+)\/edit\?etapa=2$/

test.beforeAll(async () => {
  await clearMailbox()
})

/** Cadastro + onboarding: deixa a página no Painel de um vendedor novo. */
async function signUpAsSeller(page: Page, tag: string, displayName: string) {
  await signUpAndLogin(page, uniqueEmail(tag))
  await page.goto('/seller')
  await expect(page).toHaveURL('/becomeSeller')
  await page.getByLabel('Nome de vendedor').fill(displayName)
  await page.getByRole('button', { name: 'Começar a vender' }).click()
  await expect(page).toHaveURL('/seller')
}

/**
 * Cria um rascunho pela etapa 1 e devolve o id. A primeira "Continuar" cria o
 * produto e troca a URL para /edit?etapa=2.
 */
async function createDraft(page: Page, title: string): Promise<string> {
  await page.goto('/seller/products/new')
  await page.getByRole('button', { name: /^Preset/ }).click()
  await page.getByLabel('Nome do produto').fill(title)
  await page.getByLabel('Descrição curta').fill('Timbre quente para blues e rock')
  await page.getByLabel('Sobre o pack').fill('Gravado com um Plexi de 1968.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(PRODUCT_URL)
  const { pathname, search } = new URL(page.url())
  const match = PRODUCT_URL.exec(pathname + search)
  if (!match) throw new Error(`URL de edição inesperada: ${page.url()}`)
  return match[1]
}

/** Mês anterior ao atual no fuso de Brasília (UTC-3, sem horário de verão), "2026-10". */
function previousBrasiliaMonth(): string {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const index = now.getUTCFullYear() * 12 + now.getUTCMonth() - 1
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

async function pageOverflowsHorizontally(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

test('vendedor novo: vira vendedor, cria rascunho, vê checklist', async ({ page }) => {
  await signUpAndLogin(page, uniqueEmail('seller-new'))

  // sem perfil de vendedor: /seller manda para o onboarding
  await page.goto('/seller')
  await expect(page).toHaveURL('/becomeSeller')

  await page.getByLabel('Nome de vendedor').fill('Davi Timbres')
  await page.getByRole('button', { name: 'Começar a vender' }).click()

  // Painel de quem ainda não tem produto: checklist de início
  await expect(page).toHaveURL('/seller')
  await expect(
    page.getByRole('heading', { name: 'Seu primeiro preset está perto' }),
  ).toBeVisible()

  await page
    .getByRole('main')
    .getByRole('link', { name: 'Novo produto' })
    .first()
    .click()
  await expect(page).toHaveURL('/seller/products/new')

  await page.getByRole('button', { name: /^Preset/ }).click()
  await page.getByLabel('Nome do produto').fill('Plexi 68 para Helix')
  await page.getByLabel('Descrição curta').fill('Timbre quente para blues e rock')
  await page.getByLabel('Sobre o pack').fill('Gravado com um Plexi de 1968.')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page).toHaveURL(PRODUCT_URL)
  await expect(page.getByRole('heading', { name: 'Editar produto' })).toBeVisible()

  // volta para a lista: o produto aparece em "Rascunhos" com "Continuar"
  await page.getByRole('link', { name: 'Meus produtos' }).click()
  await expect(page).toHaveURL('/seller/products')
  await page.getByRole('link', { name: /^Rascunhos/ }).click()
  await expect(page).toHaveURL('/seller/products?situacao=draft')

  const row = page.getByRole('listitem').filter({ hasText: 'Plexi 68 para Helix' })
  await expect(row).toBeVisible()
  await expect(row.getByRole('link', { name: 'Continuar' })).toBeVisible()
})

test('envio bloqueado sem arquivo do pack', async ({ page }) => {
  await signUpAsSeller(page, 'seller-blocked', 'Davi Timbres')
  await createDraft(page, 'IR Celestion 4x12')

  // etapa 2 (classificação) -> 3 (arquivos) -> 4 (preço) -> 5 (revisão)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/etapa=3$/)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/etapa=4$/)

  await page.getByLabel('Preço de venda').fill('49,90')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/etapa=5$/)

  await expect(page.getByRole('button', { name: 'Enviar para análise' })).toBeDisabled()
  await expect(
    page.getByText('Para enviar falta: arquivos do pack enviados.'),
  ).toBeVisible()
})

test('outro vendedor não abre o produto', async ({ page, browser }, testInfo) => {
  await signUpAsSeller(page, 'seller-owner', 'Dono do Produto')
  const productId = await createDraft(page, 'Preset privado')

  // o dono abre a própria edição sem problema
  await page.goto(`/seller/products/${productId}/edit`)
  await expect(page.getByRole('heading', { name: 'Editar produto' })).toBeVisible()

  // segundo vendedor, sessão separada
  const otherContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
  })
  try {
    const other = await otherContext.newPage()
    await signUpAsSeller(other, 'seller-other', 'Outro Vendedor')

    const response = await other.goto(`/seller/products/${productId}/edit`)
    expect(response?.status()).toBe(404)
    await expect(
      other.getByRole('heading', { name: 'This page could not be found.' }),
    ).toBeVisible()
    await expect(other.getByText('Preset privado')).toHaveCount(0)

    // e a lista dele não mostra o produto do outro
    await other.goto('/seller/products')
    await expect(other.getByText('Preset privado')).toHaveCount(0)
  } finally {
    await otherContext.close()
  }
})

test('celular: menu hambúrguer navega', async ({ page }) => {
  await signUpAsSeller(page, 'seller-mobile', 'Davi Timbres')
  // o checklist de início só aparece enquanto não há nenhum produto
  const checklist = page.getByRole('heading', {
    name: 'Seu primeiro preset está perto',
  })
  await expect(checklist).toBeVisible()
  const productId = await createDraft(page, 'Preset mobile')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/seller')
  // com um rascunho, o Painel vira o resumo do mês
  await expect(page.getByRole('heading', { name: 'Olá, Maria' })).toBeVisible()
  await expect(page.getByText(/^Resumo de .+ até hoje\.$/)).toBeVisible()
  await expect(checklist).toHaveCount(0)

  // sem barra lateral: nenhuma navegação "Área do vendedor" até abrir o menu
  const sellerNav = page.getByRole('navigation', { name: 'Área do vendedor' })
  await expect(sellerNav).toHaveCount(0)

  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(sellerNav).toBeVisible()
  await sellerNav.getByRole('link', { name: 'Carteira' }).click()

  await expect(page).toHaveURL('/seller/wallet')
  await expect(page.getByRole('heading', { name: 'Seu dinheiro' })).toBeVisible()
  // trocar de rota fecha o menu
  await expect(sellerNav).toHaveCount(0)

  // nenhuma tela da área do vendedor rola na horizontal em 360px nem em 390px.
  // Mês antigo em Vendas: mostra o botão "Mês atual", a linha mais larga.
  const paths = [
    '/seller',
    '/seller/sales',
    `/seller/sales?mes=${previousBrasiliaMonth()}`,
    '/seller/products',
    '/seller/products/new',
    `/seller/products/${productId}/edit?etapa=1`,
    `/seller/products/${productId}/edit?etapa=4`,
    `/seller/products/${productId}/edit?etapa=5`,
    '/seller/wallet',
    '/seller/profile',
    '/seller/payouts',
  ]
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const path of paths) {
      await page.goto(path)
      await expect(page.getByRole('main')).toBeVisible()
      expect(
        await pageOverflowsHorizontally(page),
        `rolagem horizontal em ${path} (${width}px)`,
      ).toBe(false)
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      )
      expect(scrollWidth, `scrollWidth em ${path} (${width}px)`).toBeLessThanOrEqual(
        width,
      )
    }
  }
})

// O upload vai direto do navegador para o R2 (URL assinada) e a action
// confirma o objeto no bucket, então não dá para simular sem R2 de verdade.
// Fica desligado por padrão: precisa de todas as variáveis do R2 de produto
// no .env.e2e E de E2E_ALLOW_R2_UPLOAD=1 (consentimento explícito, porque sobe
// um arquivo real e pequeno no bucket).
const R2_PRODUCT_VARS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_BUCKET',
  'R2_PUBLIC_URL',
  'R2_PRIVATE_BUCKET',
] as const

test.describe('upload do pack', () => {
  // Só confere se cada variável existe; nunca imprime os valores.
  const missingR2 = R2_PRODUCT_VARS.filter((name) => !process.env[name])
  test.skip(
    missingR2.length > 0,
    `Falta no .env.e2e: ${missingR2.join(', ')} — upload de arquivo de produto indisponível.`,
  )
  test.skip(
    process.env.E2E_ALLOW_R2_UPLOAD !== '1',
    'Sobe um arquivo real no R2; defina E2E_ALLOW_R2_UPLOAD=1 para permitir.',
  )

  test('envia arquivo do pack e manda para análise', async ({ page }) => {
    await signUpAsSeller(page, 'seller-upload', 'Davi Timbres')
    const productId = await createDraft(page, 'Pack com arquivo')

    await page.goto(`/seller/products/${productId}/edit?etapa=3`)
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'pack.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('conteudo-de-teste'),
      })
    await expect(page.getByRole('button', { name: 'Remover pack.zip' })).toBeVisible()

    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page).toHaveURL(/etapa=4$/)
    await page.getByLabel('Preço de venda').fill('49,90')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page).toHaveURL(/etapa=5$/)

    await page.getByRole('button', { name: 'Enviar para análise' }).click()
    await expect(page).toHaveURL('/seller/products?situacao=review')

    const row = page.getByRole('listitem').filter({ hasText: 'Pack com arquivo' })
    await expect(row.getByText('Em análise')).toBeVisible()

    // em análise: formulário só leitura
    await row.getByRole('link', { name: 'Ver envio' }).click()
    await expect(
      page.getByText('Em análise. Você poderá editar quando a análise terminar.'),
    ).toBeVisible()
    await page.goto(`/seller/products/${productId}/edit?etapa=1`)
    await expect(page.getByLabel('Nome do produto')).toBeDisabled()
  })
})
