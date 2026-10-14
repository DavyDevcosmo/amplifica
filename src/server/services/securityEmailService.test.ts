import { beforeEach, describe, expect, test, vi } from 'vitest'

const { afterMock, sendEmailMock } = vi.hoisted(() => ({
  afterMock: vi.fn<(task: () => unknown) => void>(),
  sendEmailMock: vi.fn<(message: Record<string, string>) => Promise<void>>(),
}))

vi.mock('next/server', () => ({ after: afterMock }))
vi.mock('@/lib/email', () => ({ sendEmail: sendEmailMock }))
vi.mock('@/lib/env', () => ({ env: { BETTER_AUTH_URL: 'https://amplifica.test' } }))

import { notifyPasswordChanged } from './securityEmailService'

describe('notifyPasswordChanged', () => {
  beforeEach(() => {
    afterMock.mockReset()
    sendEmailMock.mockReset()
    sendEmailMock.mockResolvedValue(undefined)
  })

  test('agenda o envio em after() e não envia na hora', () => {
    notifyPasswordChanged('maria@example.com')

    expect(afterMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  test('envia ao destinatário com o link de redefinição de senha', async () => {
    notifyPasswordChanged('maria@example.com')
    await afterMock.mock.calls[0][0]()

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    const message = sendEmailMock.mock.calls[0][0]
    expect(message.to).toBe('maria@example.com')
    expect(message.subject).toMatch(/senha/i)
    expect(message.html).toContain('https://amplifica.test/password/forgot')
    expect(message.text).toContain('https://amplifica.test/password/forgot')
  })

  test('falha no envio não propaga: só vai pro log', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('resend fora do ar')
    sendEmailMock.mockRejectedValue(failure)

    notifyPasswordChanged('maria@example.com')
    await expect(afterMock.mock.calls[0][0]()).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledWith('[email]', failure)
    consoleError.mockRestore()
  })
})
