import { ArgumentsHost } from '@nestjs/common'
import { BillingExceptionFilter } from '../../../src/modules/billing/presentation/filters/billing-exception.filter'
import {
  InvalidQuoteError,
  InvalidQuoteTransitionError,
  PaymentNotFoundError,
  QuoteNotFoundError,
} from '../../../src/modules/billing/domain/errors/billing.errors'

function statusFor(error: Error): number {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost

  new BillingExceptionFilter().catch(error, host)
  return (response.status.mock.calls[0] as [number])[0]
}

describe('BillingExceptionFilter', () => {
  it('maps domain errors to HTTP status codes', () => {
    expect(statusFor(new QuoteNotFoundError('wo-1'))).toBe(404)
    expect(statusFor(new PaymentNotFoundError('wo-1'))).toBe(404)
    expect(statusFor(new InvalidQuoteError('bad'))).toBe(400)
    expect(statusFor(new InvalidQuoteTransitionError('APPROVED', 'REJECTED'))).toBe(400)
  })
})
