export class InvalidQuoteError extends Error {
  constructor(reason: string) {
    super(`Invalid quote: ${reason}`)
    this.name = 'InvalidQuoteError'
  }
}

export class QuoteNotFoundError extends Error {
  constructor(workOrderId: string) {
    super(`Quote not found for work order: ${workOrderId}`)
    this.name = 'QuoteNotFoundError'
  }
}

export class InvalidQuoteTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid quote transition: ${from} -> ${to}`)
    this.name = 'InvalidQuoteTransitionError'
  }
}

export class PaymentNotFoundError extends Error {
  constructor(workOrderId: string) {
    super(`Payment not found for work order: ${workOrderId}`)
    this.name = 'PaymentNotFoundError'
  }
}
