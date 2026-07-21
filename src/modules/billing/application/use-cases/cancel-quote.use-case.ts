import { Inject, Injectable } from '@nestjs/common'
import { QUOTE_REPOSITORY } from '../ports/quote.repository'
import type { QuoteRepository } from '../ports/quote.repository'

@Injectable()
export class CancelQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quotes: QuoteRepository,
  ) {}

  async execute(workOrderId: string): Promise<void> {
    const quote = await this.quotes.findByWorkOrderId(workOrderId)
    if (!quote) {
      return
    }

    quote.cancel()
    await this.quotes.update(quote)
  }
}
