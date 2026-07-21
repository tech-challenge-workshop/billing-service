import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { QUOTE_REPOSITORY } from './application/ports/quote.repository'
import { PAYMENT_REPOSITORY } from './application/ports/payment.repository'
import { PAYMENT_GATEWAY } from './application/ports/payment.gateway'
import { GenerateQuoteUseCase } from './application/use-cases/generate-quote.use-case'
import { ApproveQuoteUseCase } from './application/use-cases/approve-quote.use-case'
import { RejectQuoteUseCase } from './application/use-cases/reject-quote.use-case'
import { CancelQuoteUseCase } from './application/use-cases/cancel-quote.use-case'
import { GetQuoteUseCase } from './application/use-cases/get-quote.use-case'
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case'
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case'
import { GetPaymentUseCase } from './application/use-cases/get-payment.use-case'
import { PrismaQuoteRepository } from './infra/prisma-quote.repository'
import { PrismaPaymentRepository } from './infra/prisma-payment.repository'
import { MercadoPagoPaymentGateway } from './infra/mercado-pago-payment.gateway'
import { SandboxPaymentGateway } from './infra/sandbox-payment.gateway'
import { QuotesController } from './presentation/quotes.controller'
import { PaymentsController } from './presentation/payments.controller'
import { BillingSagaSubscriber } from './presentation/saga/billing-saga.subscriber'

@Module({
  controllers: [QuotesController, PaymentsController],
  providers: [
    GenerateQuoteUseCase,
    ApproveQuoteUseCase,
    RejectQuoteUseCase,
    CancelQuoteUseCase,
    GetQuoteUseCase,
    ConfirmPaymentUseCase,
    RefundPaymentUseCase,
    GetPaymentUseCase,
    BillingSagaSubscriber,
    { provide: QUOTE_REPOSITORY, useClass: PrismaQuoteRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PrismaPaymentRepository },
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('MERCADO_PAGO_ACCESS_TOKEN')
        return token ? new MercadoPagoPaymentGateway(token) : new SandboxPaymentGateway()
      },
    },
  ],
})
export class BillingModule {}
