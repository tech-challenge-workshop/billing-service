import { Injectable } from '@nestjs/common'
import type { Quote as QuoteRow } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { Quote, QuoteStatus } from '../domain/quote.entity'
import { QuoteRepository } from '../application/ports/quote.repository'

@Injectable()
export class PrismaQuoteRepository implements QuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(quote: Quote): Promise<void> {
    await this.prisma.quote.create({ data: this.toRow(quote) })
  }

  async update(quote: Quote): Promise<void> {
    const { workOrderId, ...data } = this.toRow(quote)
    await this.prisma.quote.update({ where: { workOrderId }, data })
  }

  async findByWorkOrderId(workOrderId: string): Promise<Quote | null> {
    const row = await this.prisma.quote.findUnique({ where: { workOrderId } })
    return row ? this.toEntity(row) : null
  }

  private toRow(quote: Quote): QuoteRow {
    return {
      workOrderId: quote.workOrderId,
      amountCents: quote.amountCents,
      status: quote.status,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    }
  }

  private toEntity(row: QuoteRow): Quote {
    return Quote.restore({
      workOrderId: row.workOrderId,
      amountCents: row.amountCents,
      status: row.status as QuoteStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
