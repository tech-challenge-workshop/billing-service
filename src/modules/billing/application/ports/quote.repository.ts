import { Quote } from '../../domain/quote.entity'

export const QUOTE_REPOSITORY = Symbol('QUOTE_REPOSITORY')

export interface QuoteRepository {
  create(quote: Quote): Promise<void>
  update(quote: Quote): Promise<void>
  findByWorkOrderId(workOrderId: string): Promise<Quote | null>
}
