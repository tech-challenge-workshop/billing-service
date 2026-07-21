import { SandboxPaymentGateway } from '../../../../src/modules/billing/infra/sandbox-payment.gateway'
import { MercadoPagoPaymentGateway } from '../../../../src/modules/billing/infra/mercado-pago-payment.gateway'

describe('SandboxPaymentGateway', () => {
  it('approves every charge with a sandbox external id', async () => {
    const result = await new SandboxPaymentGateway().charge({
      workOrderId: 'wo-1',
      amountCents: 100,
    })

    expect(result.approved).toBe(true)
    expect(result.externalId).toMatch(/^sandbox-/)
  })

  it('resolves refunds without error', async () => {
    await expect(new SandboxPaymentGateway().refund('sandbox-1')).resolves.toBeUndefined()
  })
})

describe('MercadoPagoPaymentGateway', () => {
  const gateway = new MercadoPagoPaymentGateway('token-123')

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('approves when Mercado Pago returns an approved payment', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42, status: 'approved' }),
    } as Response)

    const result = await gateway.charge({ workOrderId: 'wo-1', amountCents: 30000 })

    expect(result).toEqual({ approved: true, externalId: '42' })
  })

  it('declines when the request is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 400 } as Response)

    const result = await gateway.charge({ workOrderId: 'wo-1', amountCents: 30000 })

    expect(result.approved).toBe(false)
  })

  it('calls the refunds endpoint', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)

    await gateway.refund('42')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/42/refunds'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
