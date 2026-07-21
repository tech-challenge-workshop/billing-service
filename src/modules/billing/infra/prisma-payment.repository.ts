import { Injectable } from '@nestjs/common'
import type { Payment as PaymentRow } from '../../../generated/prisma/client'
import { PrismaService } from '../../../shared/database/prisma.service'
import { Payment, PaymentStatus } from '../domain/payment.entity'
import { PaymentRepository } from '../application/ports/payment.repository'

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payment: Payment): Promise<void> {
    await this.prisma.payment.create({ data: this.toRow(payment) })
  }

  async update(payment: Payment): Promise<void> {
    const { id, ...data } = this.toRow(payment)
    await this.prisma.payment.update({ where: { id }, data })
  }

  async findByWorkOrderId(workOrderId: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { workOrderId } })
    return row ? this.toEntity(row) : null
  }

  private toRow(payment: Payment): PaymentRow {
    return {
      id: payment.id,
      workOrderId: payment.workOrderId,
      amountCents: payment.amountCents,
      status: payment.status,
      externalId: payment.externalId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }
  }

  private toEntity(row: PaymentRow): Payment {
    return Payment.restore({
      id: row.id,
      workOrderId: row.workOrderId,
      amountCents: row.amountCents,
      status: row.status as PaymentStatus,
      externalId: row.externalId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
