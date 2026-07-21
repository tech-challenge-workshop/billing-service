import { randomUUID } from 'node:crypto'
import { InvalidQuoteError } from './errors/billing.errors'

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentProps {
  id: string
  workOrderId: string
  amountCents: number
  status: PaymentStatus
  externalId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentInput {
  workOrderId: string
  amountCents: number
}

export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  static create(input: CreatePaymentInput): Payment {
    if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
      throw new InvalidQuoteError('amount must be a non-negative integer')
    }

    const now = new Date()
    return new Payment({
      id: randomUUID(),
      workOrderId: input.workOrderId,
      amountCents: input.amountCents,
      status: PaymentStatus.PENDING,
      externalId: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: PaymentProps): Payment {
    return new Payment(props)
  }

  confirm(externalId: string): void {
    this.props.status = PaymentStatus.CONFIRMED
    this.props.externalId = externalId
    this.props.updatedAt = new Date()
  }

  fail(): void {
    this.props.status = PaymentStatus.FAILED
    this.props.updatedAt = new Date()
  }

  refund(): void {
    if (this.props.status === PaymentStatus.CONFIRMED) {
      this.props.status = PaymentStatus.REFUNDED
      this.props.updatedAt = new Date()
    }
  }

  get id(): string {
    return this.props.id
  }

  get workOrderId(): string {
    return this.props.workOrderId
  }

  get amountCents(): number {
    return this.props.amountCents
  }

  get status(): PaymentStatus {
    return this.props.status
  }

  get externalId(): string | null {
    return this.props.externalId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isConfirmed(): boolean {
    return this.props.status === PaymentStatus.CONFIRMED
  }
}
