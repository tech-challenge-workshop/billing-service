import { validateEnv } from '../../../src/shared/config/env'

describe('validateEnv', () => {
  it('parses a valid environment applying defaults', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://localhost:5432/billing',
      RABBITMQ_URL: 'amqp://localhost:5672',
      JWT_SECRET: 'secret',
    })

    expect(env.PORT).toBe(3001)
    expect(env.RABBITMQ_QUEUE).toBe('billing_queue')
    expect(env.MERCADO_PAGO_ACCESS_TOKEN).toBe('')
  })

  it('throws when required variables are missing', () => {
    expect(() => validateEnv({})).toThrow('Invalid environment variables')
  })
})
