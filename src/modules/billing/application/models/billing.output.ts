import { Quote } from '../../domain/quote.entity'
import { Payment } from '../../domain/payment.entity'

export interface QuoteOutput {
  workOrderId: string
  amountCents: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentOutput {
  id: string
  workOrderId: string
  amountCents: number
  status: string
  externalId: string | null
  createdAt: Date
  updatedAt: Date
}

export function toQuoteOutput(quote: Quote): QuoteOutput {
  return {
    workOrderId: quote.workOrderId,
    amountCents: quote.amountCents,
    status: quote.status,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  }
}

export function toPaymentOutput(payment: Payment): PaymentOutput {
  return {
    id: payment.id,
    workOrderId: payment.workOrderId,
    amountCents: payment.amountCents,
    status: payment.status,
    externalId: payment.externalId,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}
