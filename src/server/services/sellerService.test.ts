import { beforeEach, describe, expect, test, vi } from 'vitest'

const findUnique = vi.fn()
const create = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: { sellerProfile: { findUnique, create } },
}))

const { becomeSeller } = await import('./sellerService')

beforeEach(() => {
  vi.clearAllMocks()
  create.mockImplementation(async ({ data }) => ({ id: 's1', ...data }))
})

describe('becomeSeller', () => {
  test('cria o perfil com slug do nome + sufixo, sem fundador nem avatar próprio', async () => {
    findUnique.mockResolvedValue(null)
    const seller = await becomeSeller('u1', { displayName: 'Tiago Ramos Ação' })
    expect(seller.slug).toMatch(/^tiago-ramos-acao-[0-9a-f]{6}$/)
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        displayName: 'Tiago Ramos Ação',
        bio: null,
        avatarKey: null,
        isFounder: false,
      }),
    })
  })

  test('nome sem letras latinas cai no slug "vendedor"', async () => {
    findUnique.mockResolvedValue(null)
    const seller = await becomeSeller('u1', { displayName: '日本語' })
    expect(seller.slug).toMatch(/^vendedor-[0-9a-f]{6}$/)
  })

  test('se o usuário já é vendedor, devolve o perfil existente', async () => {
    const existing = { id: 's0', userId: 'u1' }
    findUnique.mockResolvedValue(existing)
    await expect(becomeSeller('u1', { displayName: 'Outro' })).resolves.toBe(existing)
    expect(create).not.toHaveBeenCalled()
  })

  test('corrida: se o create bate na unicidade e o perfil já existe, devolve ele', async () => {
    const existing = { id: 's0', userId: 'u1' }
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existing)
    create.mockRejectedValueOnce({ code: 'P2002' })
    await expect(becomeSeller('u1', { displayName: 'Tiago' })).resolves.toBe(existing)
  })

  test('colisão de slug tenta de novo com outro sufixo', async () => {
    findUnique.mockResolvedValue(null)
    create.mockRejectedValueOnce({ code: 'P2002' })
    const seller = await becomeSeller('u1', { displayName: 'Tiago' })
    expect(seller.slug).toMatch(/^tiago-[0-9a-f]{6}$/)
    expect(create).toHaveBeenCalledTimes(2)
  })
})
