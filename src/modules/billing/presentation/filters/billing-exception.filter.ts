import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import {
  InvalidQuoteError,
  InvalidQuoteTransitionError,
  PaymentNotFoundError,
  QuoteNotFoundError,
} from '../../domain/errors/billing.errors'

@Catch(InvalidQuoteError, InvalidQuoteTransitionError, QuoteNotFoundError, PaymentNotFoundError)
export class BillingExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.statusFor(exception)

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    })
  }

  private statusFor(exception: Error): number {
    if (exception instanceof QuoteNotFoundError || exception instanceof PaymentNotFoundError) {
      return HttpStatus.NOT_FOUND
    }
    return HttpStatus.BAD_REQUEST
  }
}
