import { Payment, PaymentStatus } from '../../../../src/modules/billing/domain/payment.entity'
import { paymentWith } from '../billing.fixtures'

describe('Payment', () => {
  it('creates in PENDING status without an external id', () => {
    const payment = Payment.create({ workOrderId: 'wo-1', amountCents: 30000 })
    expect(payment.status).toBe(PaymentStatus.PENDING)
    expect(payment.externalId).toBeNull()
  })

  it('confirms with an external id', () => {
    const payment = Payment.create({ workOrderId: 'wo-1', amountCents: 30000 })
    payment.confirm('gw-1')
    expect(payment.status).toBe(PaymentStatus.CONFIRMED)
    expect(payment.externalId).toBe('gw-1')
    expect(payment.isConfirmed).toBe(true)
  })

  it('fails', () => {
    const payment = Payment.create({ workOrderId: 'wo-1', amountCents: 30000 })
    payment.fail()
    expect(payment.status).toBe(PaymentStatus.FAILED)
  })

  it('refunds only when confirmed', () => {
    const confirmed = paymentWith({ status: PaymentStatus.CONFIRMED })
    confirmed.refund()
    expect(confirmed.status).toBe(PaymentStatus.REFUNDED)

    const failed = paymentWith({ status: PaymentStatus.FAILED })
    failed.refund()
    expect(failed.status).toBe(PaymentStatus.FAILED)
  })
})
