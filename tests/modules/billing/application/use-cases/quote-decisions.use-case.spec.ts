import { QuoteStatus } from '../../../../../src/modules/billing/domain/quote.entity'
import { QuoteNotFoundError } from '../../../../../src/modules/billing/domain/errors/billing.errors'
import { ApproveQuoteUseCase } from '../../../../../src/modules/billing/application/use-cases/approve-quote.use-case'
import { RejectQuoteUseCase } from '../../../../../src/modules/billing/application/use-cases/reject-quote.use-case'
import { CancelQuoteUseCase } from '../../../../../src/modules/billing/application/use-cases/cancel-quote.use-case'
import { GetQuoteUseCase } from '../../../../../src/modules/billing/application/use-cases/get-quote.use-case'
import { FakeQuoteRepository, quoteWith } from '../../billing.fixtures'

describe('Quote decision use cases', () => {
  let quotes: FakeQuoteRepository

  beforeEach(() => {
    quotes = new FakeQuoteRepository()
  })

  it('approves a pending quote', async () => {
    const quote = quoteWith({ workOrderId: 'wo-1' })
    await quotes.create(quote)

    const output = await new ApproveQuoteUseCase(quotes).execute('wo-1')

    expect(output.status).toBe(QuoteStatus.APPROVED)
  })

  it('rejects a pending quote', async () => {
    const quote = quoteWith({ workOrderId: 'wo-1' })
    await quotes.create(quote)

    const output = await new RejectQuoteUseCase(quotes).execute('wo-1')

    expect(output.status).toBe(QuoteStatus.REJECTED)
  })

  it('throws when approving a missing quote', async () => {
    await expect(new ApproveQuoteUseCase(quotes).execute('missing')).rejects.toThrow(
      QuoteNotFoundError,
    )
  })

  it('cancels a quote and is a no-op when missing', async () => {
    const quote = quoteWith({ workOrderId: 'wo-1' })
    await quotes.create(quote)

    await new CancelQuoteUseCase(quotes).execute('wo-1')
    expect((await quotes.findByWorkOrderId('wo-1'))?.status).toBe(QuoteStatus.CANCELLED)

    await expect(new CancelQuoteUseCase(quotes).execute('missing')).resolves.toBeUndefined()
  })

  it('gets a quote or throws when missing', async () => {
    const quote = quoteWith({ workOrderId: 'wo-1' })
    await quotes.create(quote)

    expect((await new GetQuoteUseCase(quotes).execute('wo-1')).workOrderId).toBe('wo-1')
    await expect(new GetQuoteUseCase(quotes).execute('missing')).rejects.toThrow(QuoteNotFoundError)
  })
})
