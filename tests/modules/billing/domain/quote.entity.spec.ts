import { Quote, QuoteStatus } from '../../../../src/modules/billing/domain/quote.entity'
import {
  InvalidQuoteError,
  InvalidQuoteTransitionError,
} from '../../../../src/modules/billing/domain/errors/billing.errors'
import { quoteWith } from '../billing.fixtures'

describe('Quote', () => {
  it('creates in PENDING status', () => {
    const quote = Quote.create({ workOrderId: 'wo-1', amountCents: 30000 })
    expect(quote.status).toBe(QuoteStatus.PENDING)
    expect(quote.amountCents).toBe(30000)
  })

  it('rejects a negative amount', () => {
    expect(() => Quote.create({ workOrderId: 'wo-1', amountCents: -1 })).toThrow(InvalidQuoteError)
  })

  it('approves and rejects only from PENDING', () => {
    const approved = quoteWith()
    approved.approve()
    expect(approved.status).toBe(QuoteStatus.APPROVED)
    expect(() => approved.reject()).toThrow(InvalidQuoteTransitionError)

    const rejected = quoteWith()
    rejected.reject()
    expect(rejected.status).toBe(QuoteStatus.REJECTED)
  })

  it('cancels from a non-terminal status and is a no-op afterwards', () => {
    const quote = quoteWith({ status: QuoteStatus.APPROVED })
    quote.cancel()
    expect(quote.status).toBe(QuoteStatus.CANCELLED)

    const rejected = quoteWith({ status: QuoteStatus.REJECTED })
    rejected.cancel()
    expect(rejected.status).toBe(QuoteStatus.REJECTED)
  })
})
