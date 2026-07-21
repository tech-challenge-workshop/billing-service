import { PaymentStatus } from '../../../../../src/modules/billing/domain/payment.entity'
import { PaymentNotFoundError } from '../../../../../src/modules/billing/domain/errors/billing.errors'
import { RefundPaymentUseCase } from '../../../../../src/modules/billing/application/use-cases/refund-payment.use-case'
import { GetPaymentUseCase } from '../../../../../src/modules/billing/application/use-cases/get-payment.use-case'
import { FakePaymentGateway, FakePaymentRepository, paymentWith } from '../../billing.fixtures'

describe('RefundPaymentUseCase', () => {
  let payments: FakePaymentRepository
  let gateway: FakePaymentGateway
  let useCase: RefundPaymentUseCase

  beforeEach(() => {
    payments = new FakePaymentRepository()
    gateway = new FakePaymentGateway()
    useCase = new RefundPaymentUseCase(payments, gateway)
  })

  it('refunds a confirmed payment through the gateway', async () => {
    await payments.create(
      paymentWith({ workOrderId: 'wo-1', status: PaymentStatus.CONFIRMED, externalId: 'gw-9' }),
    )

    await useCase.execute('wo-1')

    expect(gateway.refunded).toContain('gw-9')
    expect((await payments.findByWorkOrderId('wo-1'))?.status).toBe(PaymentStatus.REFUNDED)
  })

  it('is a no-op when there is no confirmed payment', async () => {
    await useCase.execute('missing')
    expect(gateway.refunded).toHaveLength(0)
  })

  it('gets a payment or throws when missing', async () => {
    await payments.create(paymentWith({ workOrderId: 'wo-1' }))

    expect((await new GetPaymentUseCase(payments).execute('wo-1')).workOrderId).toBe('wo-1')
    await expect(new GetPaymentUseCase(payments).execute('missing')).rejects.toThrow(
      PaymentNotFoundError,
    )
  })
})
