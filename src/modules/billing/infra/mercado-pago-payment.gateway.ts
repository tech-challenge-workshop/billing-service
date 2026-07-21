import { ChargeInput, ChargeResult, PaymentGateway } from '../application/ports/payment.gateway'

const PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'

interface MercadoPagoPayment {
  id: number
  status: string
}

export class MercadoPagoPaymentGateway implements PaymentGateway {
  constructor(private readonly accessToken: string) {}

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const response = await fetch(PAYMENTS_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.accessToken}`,
        'x-idempotency-key': input.workOrderId,
      },
      body: JSON.stringify({
        transaction_amount: input.amountCents / 100,
        description: `Work order ${input.workOrderId}`,
        payment_method_id: 'pix',
      }),
    })

    if (!response.ok) {
      return { approved: false, externalId: '' }
    }

    const payment = (await response.json()) as MercadoPagoPayment
    return { approved: payment.status === 'approved', externalId: String(payment.id) }
  }

  async refund(externalId: string): Promise<void> {
    await fetch(`${PAYMENTS_URL}/${externalId}/refunds`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.accessToken}` },
    })
  }
}
