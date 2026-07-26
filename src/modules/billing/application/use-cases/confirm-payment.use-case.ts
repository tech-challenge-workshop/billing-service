import { Inject, Injectable } from '@nestjs/common'
import { QuoteNotFoundError } from '../../domain/errors/billing.errors'
import { Payment } from '../../domain/payment.entity'
import { QUOTE_REPOSITORY } from '../ports/quote.repository'
import type { QuoteRepository } from '../ports/quote.repository'
import { PAYMENT_REPOSITORY } from '../ports/payment.repository'
import type { PaymentRepository } from '../ports/payment.repository'
import { PAYMENT_GATEWAY } from '../ports/payment.gateway'
import type { PaymentGateway } from '../ports/payment.gateway'
import { TRACING_PORT } from '../../../../shared/tracing/tracing.port'
import type { TracingPort } from '../../../../shared/tracing/tracing.port'

export interface ConfirmPaymentResult {
  confirmed: boolean
}

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepository,
    @Inject(QUOTE_REPOSITORY)
    private readonly quotes: QuoteRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGateway,
    @Inject(TRACING_PORT)
    private readonly tracing: TracingPort,
  ) {}

  async execute(workOrderId: string): Promise<ConfirmPaymentResult> {
    const span = this.tracing.startSpan('billing.confirm_payment', { workOrderId })
    try {
      const existing = await this.payments.findByWorkOrderId(workOrderId)
      if (existing) {
        span.finish()
        return { confirmed: existing.isConfirmed }
      }

      const quote = await this.quotes.findByWorkOrderId(workOrderId)
      if (!quote) {
        throw new QuoteNotFoundError(workOrderId)
      }

      const payment = Payment.create({ workOrderId, amountCents: quote.amountCents })
      const result = await this.gateway.charge({ workOrderId, amountCents: quote.amountCents })

      if (result.approved) {
        payment.confirm(result.externalId)
      } else {
        payment.fail()
      }
      await this.payments.create(payment)

      span.finish()
      return { confirmed: result.approved }
    } catch (err) {
      span.error(err as Error)
      throw err
    }
  }
}
