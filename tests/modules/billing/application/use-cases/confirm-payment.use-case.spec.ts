import { PaymentStatus } from '../../../../../src/modules/billing/domain/payment.entity'
import { QuoteNotFoundError } from '../../../../../src/modules/billing/domain/errors/billing.errors'
import { ConfirmPaymentUseCase } from '../../../../../src/modules/billing/application/use-cases/confirm-payment.use-case'
import {
  FakePaymentGateway,
  FakePaymentRepository,
  FakeQuoteRepository,
  quoteWith,
} from '../../billing.fixtures'

describe('ConfirmPaymentUseCase', () => {
  let payments: FakePaymentRepository
  let quotes: FakeQuoteRepository
  let gateway: FakePaymentGateway
  let useCase: ConfirmPaymentUseCase

  beforeEach(() => {
    payments = new FakePaymentRepository()
    quotes = new FakeQuoteRepository()
    gateway = new FakePaymentGateway()
    useCase = new ConfirmPaymentUseCase(payments, quotes, gateway)
  })

  it('confirms the payment when the gateway approves', async () => {
    await quotes.create(quoteWith({ workOrderId: 'wo-1', amountCents: 30000 }))

    const result = await useCase.execute('wo-1')

    expect(result.confirmed).toBe(true)
    const payment = await payments.findByWorkOrderId('wo-1')
    expect(payment?.status).toBe(PaymentStatus.CONFIRMED)
    expect(payment?.amountCents).toBe(30000)
  })

  it('fails the payment when the gateway declines', async () => {
    gateway.approved = false
    await quotes.create(quoteWith({ workOrderId: 'wo-1' }))

    const result = await useCase.execute('wo-1')

    expect(result.confirmed).toBe(false)
    expect((await payments.findByWorkOrderId('wo-1'))?.status).toBe(PaymentStatus.FAILED)
  })

  it('is idempotent for an existing payment', async () => {
    await quotes.create(quoteWith({ workOrderId: 'wo-1' }))
    await useCase.execute('wo-1')

    const result = await useCase.execute('wo-1')

    expect(result.confirmed).toBe(true)
  })

  it('throws when there is no quote to charge', async () => {
    await expect(useCase.execute('missing')).rejects.toThrow(QuoteNotFoundError)
  })
})
