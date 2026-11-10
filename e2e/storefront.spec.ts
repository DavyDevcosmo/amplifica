import { expect, test } from '@playwright/test'

// Telas da loja (redesign Marinho). Todas usam os dados de exemplo de
// src/components/product/sampleProducts.ts e nenhuma grava no banco: o único
// acesso a dado é o getSession() do cabeçalho, sem cookie de sessão.

test('home: hero com h1 e chips de pedaleira filtrando a grade', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Liga a pedaleira. O som a gente resolve',
    }),
  ).toBeVisible()
  // deslogado: o cabeçalho flutuante oferece "Entrar", não "Minha conta"
  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await expect(header.getByRole('link', { name: 'Minha conta' })).toHaveCount(0)

  const catalog = page.locator('section#catalogo')
  const all = catalog.getByRole('button', { name: 'Todas' })
  const kemper = catalog.getByRole('button', { name: 'KEMPER', exact: true })
  const plexi = catalog.getByRole('link', { name: 'Plexi 68 — Helix', exact: true })
  const clean = catalog.getByRole('link', { name: 'Clean americano', exact: true })

  await expect(all).toHaveAttribute('aria-pressed', 'true')
  await expect(plexi).toBeVisible()
  await expect(clean).toBeVisible()

  await kemper.click()
  await expect(kemper).toHaveAttribute('aria-pressed', 'true')
  await expect(all).toHaveAttribute('aria-pressed', 'false')
  await expect(
    catalog.getByRole('heading', { level: 2, name: 'Presets para KEMPER' }),
  ).toBeVisible()
  await expect(clean).toBeVisible()
  await expect(plexi).toHaveCount(0)

  // pedaleira sem produto: estado vazio com ação que volta pra todas
  await catalog.getByRole('button', { name: 'ZOOM', exact: true }).click()
  await expect(catalog.getByText('Nada para ZOOM ainda')).toBeVisible()
  await catalog.getByRole('button', { name: 'Ver todas as pedaleiras' }).click()
  await expect(all).toHaveAttribute('aria-pressed', 'true')
  await expect(plexi).toBeVisible()
})

test('produto: /products/plexi-68-helix mostra título, preço e alterna o carrinho', async ({
  page,
}) => {
  const response = await page.goto('/products/plexi-68-helix')
  expect(response?.status()).toBe(200)

  await expect(
    page.getByRole('heading', { level: 1, name: 'Plexi 68 — Helix' }),
  ).toBeVisible()

  const buy = page.getByRole('complementary', { name: 'Comprar' })
  // preço com desconto (R$ 67,92) e o original riscado (R$ 79,90)
  await expect(buy.getByText(/67,92/)).toBeVisible()
  await expect(buy.locator('s')).toContainText('79,90')

  const cart = buy.getByRole('button', { name: 'Adicionar ao carrinho' })
  await expect(cart).toHaveAttribute('aria-pressed', 'false')
  await cart.click()
  const inCart = buy.getByRole('button', { name: 'No carrinho' })
  await expect(inCart).toHaveAttribute('aria-pressed', 'true')
  await inCart.click()
  await expect(
    buy.getByRole('button', { name: 'Adicionar ao carrinho' }),
  ).toHaveAttribute('aria-pressed', 'false')
})

test('produto: slug inexistente mostra a página 404 com noindex', async ({ page }) => {
  await page.goto('/products/slug-inexistente')
  await expect(
    page.getByRole('heading', { name: 'This page could not be found.' }),
  ).toBeVisible()
  // o Next injeta a meta duas vezes (shell e boundary do not-found): basta a 1ª
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    'content',
    /noindex/,
  )
})

// Hoje responde 200: o loading.tsx de (store) abre um Suspense e o Next já
// enviou o status antes de o notFound() da página rodar (soft 404).
test('produto: slug inexistente responde HTTP 404', async ({ request }) => {
  const response = await request.get('/products/slug-inexistente')
  expect(response.status()).toBe(404)
})

test('/sell: simulador recalcula "Você recebe" ao desligar o switch de Fundador', async ({
  page,
}) => {
  await page.goto('/sell')

  await expect(
    page.getByRole('heading', { name: 'Quanto seus presets podem render?' }),
  ).toBeVisible()
  const net = page.getByText('Você recebe (estimado)').locator('..').locator('output')
  const founder = page.getByRole('switch', { name: /vendedor fundador/ })

  await expect(founder).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText(/Comissão Amplifica \(15%\) · 10 isentas/)).toBeVisible()
  const withFounder = (await net.textContent())?.trim()
  expect(withFounder).toMatch(/R\$/)

  await founder.click()
  await expect(founder).toHaveAttribute('aria-checked', 'false')
  await expect(
    page.getByText('Comissão Amplifica (15%)', { exact: true }),
  ).toBeVisible()
  // sem a isenção, a comissão incide sobre todas as vendas: o líquido cai
  await expect(net).not.toHaveText(withFounder ?? '')
})

test('/sell: cada slider do simulador tem um thumb só', async ({ page }) => {
  await page.goto('/sell')
  await expect(page.getByRole('slider', { name: 'Preço do preset' })).toHaveCount(1)
  await expect(page.getByRole('slider', { name: 'Vendas no mês' })).toHaveCount(1)
})

test.describe('header mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('esconde a navegação e abre o menu com os links da loja', async ({ page }) => {
    await page.goto('/')
    const header = page.getByRole('banner')

    await expect(header.getByRole('navigation', { name: 'Principal' })).toBeHidden()
    await expect(header.getByRole('link', { name: 'Entrar' })).toBeHidden()

    await header.getByRole('button', { name: 'Abrir menu' }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    for (const name of ['Presets', 'Pedaleiras', 'Como funciona', 'Seja vendedor']) {
      await expect(menu.getByRole('menuitem', { name })).toBeVisible()
    }
    await expect(menu.getByRole('menuitem', { name: 'Entrar' })).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Criar conta' })).toBeVisible()

    await menu.getByRole('menuitem', { name: 'Seja vendedor' }).click()
    await expect(page).toHaveURL('/sell')
  })
})
