import { Inject, Injectable } from '@nestjs/common'
import { PaymentNotFoundError } from '../../domain/errors/billing.errors'
import { PAYMENT_REPOSITORY } from '../ports/payment.repository'
import type { PaymentRepository } from '../ports/payment.repository'
import { PaymentOutput, toPaymentOutput } from '../models/billing.output'

@Injectable()
export class GetPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly payments: PaymentRepository,
  ) {}

  async execute(workOrderId: string): Promise<PaymentOutput> {
    const payment = await this.payments.findByWorkOrderId(workOrderId)
    if (!payment) {
      throw new PaymentNotFoundError(workOrderId)
    }
    return toPaymentOutput(payment)
  }
}
