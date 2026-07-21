import { Inject, Injectable } from '@nestjs/common'
import { Quote } from '../../domain/quote.entity'
import { QUOTE_REPOSITORY } from '../ports/quote.repository'
import type { QuoteRepository } from '../ports/quote.repository'

export interface GenerateQuoteCommand {
  workOrderId: string
  totalCents: number
}

@Injectable()
export class GenerateQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quotes: QuoteRepository,
  ) {}

  async execute(command: GenerateQuoteCommand): Promise<void> {
    const existing = await this.quotes.findByWorkOrderId(command.workOrderId)
    if (existing) {
      return
    }

    const quote = Quote.create({
      workOrderId: command.workOrderId,
      amountCents: command.totalCents,
    })
    await this.quotes.create(quote)
  }
}
