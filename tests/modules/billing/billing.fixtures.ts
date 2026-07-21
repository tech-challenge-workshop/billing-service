import { randomUUID } from 'node:crypto'
import { Quote, QuoteProps, QuoteStatus } from '../../../src/modules/billing/domain/quote.entity'
import {
  Payment,
  PaymentProps,
  PaymentStatus,
} from '../../../src/modules/billing/domain/payment.entity'
import type { QuoteRepository } from '../../../src/modules/billing/application/ports/quote.repository'
import type { PaymentRepository } from '../../../src/modules/billing/application/ports/payment.repository'
import type {
  ChargeInput,
  ChargeResult,
  PaymentGateway,
} from '../../../src/modules/billing/application/ports/payment.gateway'

export function quoteWith(overrides: Partial<QuoteProps> = {}): Quote {
  return Quote.restore({
    workOrderId: randomUUID(),
    amountCents: 30000,
    status: QuoteStatus.PENDING,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  })
}

export function paymentWith(overrides: Partial<PaymentProps> = {}): Payment {
  return Payment.restore({
    id: randomUUID(),
    workOrderId: randomUUID(),
    amountCents: 30000,
    status: PaymentStatus.CONFIRMED,
    externalId: 'sandbox-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  })
}

export class FakeQuoteRepository implements QuoteRepository {
  quotes = new Map<string, Quote>()

  create(quote: Quote): Promise<void> {
    this.quotes.set(quote.workOrderId, quote)
    return Promise.resolve()
  }

  update(quote: Quote): Promise<void> {
    this.quotes.set(quote.workOrderId, quote)
    return Promise.resolve()
  }

  findByWorkOrderId(workOrderId: string): Promise<Quote | null> {
    return Promise.resolve(this.quotes.get(workOrderId) ?? null)
  }
}

export class FakePaymentRepository implements PaymentRepository {
  payments = new Map<string, Payment>()

  create(payment: Payment): Promise<void> {
    this.payments.set(payment.workOrderId, payment)
    return Promise.resolve()
  }

  update(payment: Payment): Promise<void> {
    this.payments.set(payment.workOrderId, payment)
    return Promise.resolve()
  }

  findByWorkOrderId(workOrderId: string): Promise<Payment | null> {
    return Promise.resolve(this.payments.get(workOrderId) ?? null)
  }
}

export class FakePaymentGateway implements PaymentGateway {
  approved = true
  refunded: string[] = []

  charge(_input: ChargeInput): Promise<ChargeResult> {
    return Promise.resolve({ approved: this.approved, externalId: 'gw-123' })
  }

  refund(externalId: string): Promise<void> {
    this.refunded.push(externalId)
    return Promise.resolve()
  }
}
