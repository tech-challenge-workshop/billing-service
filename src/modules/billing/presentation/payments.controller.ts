import { Controller, Get, Param, ParseUUIDPipe, UseFilters } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../../shared/auth/roles.decorator'
import { UserRole } from '../../../shared/auth/jwt-payload'
import { GetPaymentUseCase } from '../application/use-cases/get-payment.use-case'
import { BillingExceptionFilter } from './filters/billing-exception.filter'

@ApiTags('payments')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseFilters(BillingExceptionFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly getPayment: GetPaymentUseCase) {}

  @Get(':workOrderId')
  @ApiOperation({ summary: 'Get the payment for a work order' })
  get(@Param('workOrderId', ParseUUIDPipe) workOrderId: string) {
    return this.getPayment.execute(workOrderId)
  }
}
