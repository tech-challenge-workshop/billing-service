import { InvalidQuoteError, InvalidQuoteTransitionError } from './errors/billing.errors'

export enum QuoteStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface QuoteProps {
  workOrderId: string
  amountCents: number
  status: QuoteStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateQuoteInput {
  workOrderId: string
  amountCents: number
}

export class Quote {
  private constructor(private readonly props: QuoteProps) {}

  static create(input: CreateQuoteInput): Quote {
    if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
      throw new InvalidQuoteError('amount must be a non-negative integer')
    }

    const now = new Date()
    return new Quote({
      workOrderId: input.workOrderId,
      amountCents: input.amountCents,
      status: QuoteStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: QuoteProps): Quote {
    return new Quote(props)
  }

  approve(): void {
    this.transitionFromPending(QuoteStatus.APPROVED)
  }

  reject(): void {
    this.transitionFromPending(QuoteStatus.REJECTED)
  }

  cancel(): void {
    if (this.props.status === QuoteStatus.REJECTED || this.props.status === QuoteStatus.CANCELLED) {
      return
    }
    this.props.status = QuoteStatus.CANCELLED
    this.props.updatedAt = new Date()
  }

  private transitionFromPending(target: QuoteStatus): void {
    if (this.props.status !== QuoteStatus.PENDING) {
      throw new InvalidQuoteTransitionError(this.props.status, target)
    }
    this.props.status = target
    this.props.updatedAt = new Date()
  }

  get workOrderId(): string {
    return this.props.workOrderId
  }

  get amountCents(): number {
    return this.props.amountCents
  }

  get status(): QuoteStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
