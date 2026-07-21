import { Inject, Injectable } from '@nestjs/common'
import { PAYMENT_REPOSITORY } from '../ports/payment.repository'
import type { PaymentRepository } from '../ports/payment.repository'
import { PAYMENT_GATEWAY } from '../ports/payment.gateway'
import type { PaymentGateway } from '../ports/payment.gateway'

@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGateway,
  ) {}

  async execute(workOrderId: string): Promise<void> {
    const payment = await this.payments.findByWorkOrderId(workOrderId)
    if (!payment || !payment.isConfirmed || !payment.externalId) {
      return
    }

    await this.gateway.refund(payment.externalId)
    payment.refund()
    await this.payments.update(payment)
  }
}
