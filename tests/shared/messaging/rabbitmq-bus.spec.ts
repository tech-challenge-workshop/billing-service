import { ConfigService } from '@nestjs/config'
import { RabbitMqBus } from '../../../src/shared/messaging/rabbitmq-bus'

interface BusInternals {
  channel?: { ack: jest.Mock }
  dispatch(message: unknown): void
}

function makeBus(): RabbitMqBus {
  const config = {
    getOrThrow: (key: string) => (key === 'RABBITMQ_URL' ? 'amqp://localhost:5672' : 'queue'),
  } as unknown as ConfigService
  return new RabbitMqBus(config)
}

function messageFor(routingKey: string, payload: Record<string, unknown> = {}) {
  return { content: Buffer.from(JSON.stringify(payload)), fields: { routingKey } }
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('RabbitMqBus', () => {
  it('throws when publishing before initialization', async () => {
    await expect(makeBus().publish('rk', {})).rejects.toThrow('not initialized')
  })

  it('dispatches a message to the subscribed handler and acks it', async () => {
    const bus = makeBus()
    const handler = jest.fn().mockResolvedValue(undefined)
    bus.subscribe('rk', handler)

    const ack = jest.fn()
    const internals = bus as unknown as BusInternals
    internals.channel = { ack }
    const message = messageFor('rk', { a: 1 })
    internals.dispatch(message)
    await flush()

    expect(handler).toHaveBeenCalledWith({ a: 1 })
    expect(ack).toHaveBeenCalledWith(message)
  })

  it('acks and ignores messages without a handler', () => {
    const bus = makeBus()
    const ack = jest.fn()
    const internals = bus as unknown as BusInternals
    internals.channel = { ack }
    const message = messageFor('unknown')
    internals.dispatch(message)

    expect(ack).toHaveBeenCalledWith(message)
  })

  it('ignores a null message', () => {
    const bus = makeBus()
    const internals = bus as unknown as BusInternals
    internals.channel = { ack: jest.fn() }

    expect(() => internals.dispatch(null)).not.toThrow()
  })

  it('acks even when the handler rejects', async () => {
    const bus = makeBus()
    bus.subscribe('rk', jest.fn().mockRejectedValue(new Error('boom')))

    const ack = jest.fn()
    const internals = bus as unknown as BusInternals
    internals.channel = { ack }
    internals.dispatch(messageFor('rk'))
    await flush()

    expect(ack).toHaveBeenCalled()
  })
})
