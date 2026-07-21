import { Controller, Get, Inject, Param, ParseUUIDPipe, Post, UseFilters } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { MESSAGE_BUS } from '../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../shared/messaging/saga-messages'
import { ApproveQuoteUseCase } from '../application/use-cases/approve-quote.use-case'
import { RejectQuoteUseCase } from '../application/use-cases/reject-quote.use-case'
import { GetQuoteUseCase } from '../application/use-cases/get-quote.use-case'
import { BillingExceptionFilter } from './filters/billing-exception.filter'

@ApiTags('quotes')
@UseFilters(BillingExceptionFilter)
@Controller('quotes')
export class QuotesController {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly approveQuote: ApproveQuoteUseCase,
    private readonly rejectQuote: RejectQuoteUseCase,
    private readonly getQuote: GetQuoteUseCase,
  ) {}

  @Get(':workOrderId')
  @ApiOperation({ summary: 'Get the quote for a work order' })
  get(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.getQuote.execute(workOrderId)
  }

  @Post(':workOrderId/approve')
  @ApiOperation({ summary: 'Customer approves the quote (approval webhook)' })
  async approve(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    const output = await this.approveQuote.execute(workOrderId)
    await this.bus.publish(SagaMessage.QuoteApproved, { workOrderId })
    return output
  }

  @Post(':workOrderId/reject')
  @ApiOperation({ summary: 'Customer rejects the quote (approval webhook)' })
  async reject(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    const output = await this.rejectQuote.execute(workOrderId)
    await this.bus.publish(SagaMessage.QuoteRejected, { workOrderId })
    return output
  }
}
