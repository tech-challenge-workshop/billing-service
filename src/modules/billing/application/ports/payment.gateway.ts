export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY')

export interface ChargeInput {
  workOrderId: string
  amountCents: number
}

export interface ChargeResult {
  approved: boolean
  externalId: string
}

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>
  refund(externalId: string): Promise<void>
}
