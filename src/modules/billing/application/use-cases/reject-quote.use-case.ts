import { Inject, Injectable } from '@nestjs/common'
import { QuoteNotFoundError } from '../../domain/errors/billing.errors'
import { QUOTE_REPOSITORY } from '../ports/quote.repository'
import type { QuoteRepository } from '../ports/quote.repository'
import { QuoteOutput, toQuoteOutput } from '../models/billing.output'

@Injectable()
export class RejectQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quotes: QuoteRepository,
  ) {}

  async execute(workOrderId: string): Promise<QuoteOutput> {
    const quote = await this.quotes.findByWorkOrderId(workOrderId)
    if (!quote) {
      throw new QuoteNotFoundError(workOrderId)
    }

    quote.reject()
    await this.quotes.update(quote)
    return toQuoteOutput(quote)
  }
}
