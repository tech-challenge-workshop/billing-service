import { Inject, Injectable } from '@nestjs/common'
import { Quote } from '../../domain/quote.entity'
import { QUOTE_REPOSITORY } from '../ports/quote.repository'
import type { QuoteRepository } from '../ports/quote.repository'
import { TRACING_PORT } from '../../../../shared/observability/tracing.port'
import type { TracingPort } from '../../../../shared/observability/tracing.port'

export interface GenerateQuoteCommand {
  workOrderId: string
  totalCents: number
}

@Injectable()
export class GenerateQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quotes: QuoteRepository,
    @Inject(TRACING_PORT)
    private readonly tracing: TracingPort,
  ) {}

  execute(command: GenerateQuoteCommand): Promise<void> {
    return this.tracing.withSpan(
      'billing.generate_quote',
      { workOrderId: command.workOrderId },
      async () => {
        const existing = await this.quotes.findByWorkOrderId(command.workOrderId)
        if (existing) {
          return
        }

        const quote = Quote.create({
          workOrderId: command.workOrderId,
          amountCents: command.totalCents,
        })
        await this.quotes.create(quote)
      },
    )
  }
}
