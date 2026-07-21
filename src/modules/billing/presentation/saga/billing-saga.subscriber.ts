import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { MESSAGE_BUS } from '../../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type {
  GenerateQuotePayload,
  WorkOrderRefPayload,
} from '../../../../shared/messaging/saga-messages'
import { GenerateQuoteUseCase } from '../../application/use-cases/generate-quote.use-case'
import { CancelQuoteUseCase } from '../../application/use-cases/cancel-quote.use-case'
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case'
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case'

@Injectable()
export class BillingSagaSubscriber implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly generateQuote: GenerateQuoteUseCase,
    private readonly cancelQuote: CancelQuoteUseCase,
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(SagaMessage.GenerateQuote, (payload) => this.onGenerateQuote(payload))
    this.bus.subscribe(SagaMessage.CancelQuote, (payload) => this.onCancelQuote(payload))
    this.bus.subscribe(SagaMessage.ConfirmPayment, (payload) => this.onConfirmPayment(payload))
    this.bus.subscribe(SagaMessage.RefundPayment, (payload) => this.onRefundPayment(payload))
  }

  private async onGenerateQuote(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId, totalCents } = payload as unknown as GenerateQuotePayload
    await this.generateQuote.execute({ workOrderId, totalCents })
    await this.bus.publish(SagaMessage.QuoteGenerated, { workOrderId })
  }

  private async onCancelQuote(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.cancelQuote.execute(workOrderId)
  }

  private async onConfirmPayment(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    const { confirmed } = await this.confirmPayment.execute(workOrderId)
    const event = confirmed ? SagaMessage.PaymentConfirmed : SagaMessage.PaymentFailed
    await this.bus.publish(event, { workOrderId })
  }

  private async onRefundPayment(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.refundPayment.execute(workOrderId)
  }
}
