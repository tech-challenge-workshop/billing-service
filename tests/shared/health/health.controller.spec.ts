import { HealthController } from '../../../src/shared/health/health.controller'

describe('HealthController', () => {
  it('returns ok status', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok', service: 'billing-service' })
  })
})
