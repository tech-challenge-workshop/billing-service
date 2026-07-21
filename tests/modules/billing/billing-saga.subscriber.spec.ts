import { BillingSagaSubscriber } from '../../../src/modules/billing/presentation/saga/billing-saga.subscriber'
import { GenerateQuoteUseCase } from '../../../src/modules/billing/application/use-cases/generate-quote.use-case'
import { CancelQuoteUseCase } from '../../../src/modules/billing/application/use-cases/cancel-quote.use-case'
import { ConfirmPaymentUseCase } from '../../../src/modules/billing/application/use-cases/confirm-payment.use-case'
import { RefundPaymentUseCase } from '../../../src/modules/billing/application/use-cases/refund-payment.use-case'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import type { MessageBus, MessageHandler } from '../../../src/shared/messaging/message-bus'

class CapturingBus implements MessageBus {
  handlers = new Map<string, MessageHandler>()
  published: string[] = []

  publish(routingKey: string): Promise<void> {
    this.published.push(routingKey)
    return Promise.resolve()
  }

  subscribe(routingKey: string, handler: MessageHandler): void {
    this.handlers.set(routingKey, handler)
  }
}

describe('BillingSagaSubscriber', () => {
  let bus: CapturingBus
  let generate: jest.Mock
  let cancel: jest.Mock
  let confirm: jest.Mock
  let refund: jest.Mock

  function setup(): void {
    bus = new CapturingBus()
    generate = jest.fn().mockResolvedValue(undefined)
    cancel = jest.fn().mockResolvedValue(undefined)
    confirm = jest.fn().mockResolvedValue({ confirmed: true })
    refund = jest.fn().mockResolvedValue(undefined)

    new BillingSagaSubscriber(
      bus,
      { execute: generate } as unknown as GenerateQuoteUseCase,
      { execute: cancel } as unknown as CancelQuoteUseCase,
      { execute: confirm } as unknown as ConfirmPaymentUseCase,
      { execute: refund } as unknown as RefundPaymentUseCase,
    ).onModuleInit()
  }

  beforeEach(setup)

  it('generates a quote and replies quote.generated', async () => {
    await bus.handlers.get(SagaMessage.GenerateQuote)!({ workOrderId: 'wo-1', totalCents: 30000 })

    expect(generate).toHaveBeenCalledWith({ workOrderId: 'wo-1', totalCents: 30000 })
    expect(bus.published).toContain(SagaMessage.QuoteGenerated)
  })

  it('replies payment.confirmed when the payment is confirmed', async () => {
    await bus.handlers.get(SagaMessage.ConfirmPayment)!({ workOrderId: 'wo-1' })
    expect(bus.published).toContain(SagaMessage.PaymentConfirmed)
  })

  it('replies payment.failed when the payment is declined', async () => {
    confirm.mockResolvedValueOnce({ confirmed: false })

    await bus.handlers.get(SagaMessage.ConfirmPayment)!({ workOrderId: 'wo-1' })

    expect(bus.published).toContain(SagaMessage.PaymentFailed)
  })

  it('cancels the quote and refunds on compensation commands', async () => {
    await bus.handlers.get(SagaMessage.CancelQuote)!({ workOrderId: 'wo-1' })
    await bus.handlers.get(SagaMessage.RefundPayment)!({ workOrderId: 'wo-1' })

    expect(cancel).toHaveBeenCalledWith('wo-1')
    expect(refund).toHaveBeenCalledWith('wo-1')
  })
})
