export const SagaMessage = {
  GenerateQuote: 'quote.generate',
  QuoteGenerated: 'quote.generated',
  QuoteApproved: 'quote.approved',
  QuoteRejected: 'quote.rejected',
  CancelQuote: 'quote.cancel',
  ConfirmPayment: 'payment.confirm',
  PaymentConfirmed: 'payment.confirmed',
  PaymentFailed: 'payment.failed',
  RefundPayment: 'payment.refund',
} as const

export interface GenerateQuotePayload {
  workOrderId: string
  totalCents: number
}

export interface WorkOrderRefPayload {
  workOrderId: string
}
