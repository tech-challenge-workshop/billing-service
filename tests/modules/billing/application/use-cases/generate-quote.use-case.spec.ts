import { GenerateQuoteUseCase } from '../../../../../src/modules/billing/application/use-cases/generate-quote.use-case'
import { FakeQuoteRepository, FakeTracingPort } from '../../billing.fixtures'

describe('GenerateQuoteUseCase', () => {
  let quotes: FakeQuoteRepository
  let useCase: GenerateQuoteUseCase

  beforeEach(() => {
    quotes = new FakeQuoteRepository()
    useCase = new GenerateQuoteUseCase(quotes, new FakeTracingPort())
  })

  it('creates a pending quote from the total', async () => {
    await useCase.execute({ workOrderId: 'wo-1', totalCents: 30000 })

    const quote = await quotes.findByWorkOrderId('wo-1')
    expect(quote?.amountCents).toBe(30000)
  })

  it('is idempotent when a quote already exists', async () => {
    await useCase.execute({ workOrderId: 'wo-1', totalCents: 30000 })
    await useCase.execute({ workOrderId: 'wo-1', totalCents: 99999 })

    const quote = await quotes.findByWorkOrderId('wo-1')
    expect(quote?.amountCents).toBe(30000)
  })
})
