import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ChargeInput, ChargeResult, PaymentGateway } from '../application/ports/payment.gateway'

@Injectable()
export class SandboxPaymentGateway implements PaymentGateway {
  charge(_input: ChargeInput): Promise<ChargeResult> {
    return Promise.resolve({ approved: true, externalId: `sandbox-${randomUUID()}` })
  }

  refund(_externalId: string): Promise<void> {
    return Promise.resolve()
  }
}
