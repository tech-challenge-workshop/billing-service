import { Payment } from '../../domain/payment.entity'

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY')

export interface PaymentRepository {
  create(payment: Payment): Promise<void>
  update(payment: Payment): Promise<void>
  findByWorkOrderId(workOrderId: string): Promise<Payment | null>
}
