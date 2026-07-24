import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const WO = '390a5b7c-1111-4abc-8def-000000000001'
const MISSING = '00000000-0000-4000-8000-000000000000'

describe('Billing (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService
  let adminBearer: string
  let customerBearer: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    )
    await app.init()

    prisma = app.get(PrismaService)
    const jwt = app.get(JwtService)
    adminBearer = `Bearer ${jwt.sign({ sub: 'e2e-admin', role: 'admin' })}`
    customerBearer = `Bearer ${jwt.sign({ sub: 'e2e-customer', role: 'customer' })}`
  })

  beforeEach(async () => {
    await prisma.payment.deleteMany()
    await prisma.quote.deleteMany()
  })

  afterAll(async () => {
    await prisma.payment.deleteMany()
    await prisma.quote.deleteMany()
    await app.close()
  })

  const asAdmin = () => {
    const server = app.getHttpServer()
    return {
      get: (url: string) => request(server).get(url).set('Authorization', adminBearer),
      post: (url: string) => request(server).post(url).set('Authorization', adminBearer),
    }
  }

  const asCustomer = () => {
    const server = app.getHttpServer()
    return {
      get: (url: string) => request(server).get(url).set('Authorization', customerBearer),
      post: (url: string) => request(server).post(url).set('Authorization', customerBearer),
    }
  }

  async function seedQuote(status = 'PENDING'): Promise<void> {
    const now = new Date()
    await prisma.quote.create({
      data: {
        workOrderId: WO,
        amountCents: 30000,
        status: status as 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  describe('GET /quotes/:workOrderId', () => {
    it('returns the quote', async () => {
      await seedQuote()
      const res = await asAdmin().get(`/quotes/${WO}`).expect(200)
      expect(res.body).toMatchObject({ workOrderId: WO, amountCents: 30000, status: 'PENDING' })
    })

    it('returns 404 when missing', async () => {
      await asAdmin().get(`/quotes/${MISSING}`).expect(404)
    })

    it('rejects a customer reading a quote', async () => {
      await seedQuote()
      await asCustomer().get(`/quotes/${WO}`).expect(403)
    })
  })

  describe('POST /quotes/:workOrderId/approve', () => {
    it('approves a pending quote', async () => {
      await seedQuote()
      const res = await asCustomer().post(`/quotes/${WO}/approve`).expect(201)
      expect(res.body).toMatchObject({ workOrderId: WO, status: 'APPROVED' })
    })

    it('returns 400 when approving an already approved quote', async () => {
      await seedQuote('APPROVED')
      await asCustomer().post(`/quotes/${WO}/approve`).expect(400)
    })

    it('returns 404 when the quote does not exist', async () => {
      await asCustomer().post(`/quotes/${MISSING}/approve`).expect(404)
    })
  })

  describe('POST /quotes/:workOrderId/reject', () => {
    it('rejects a pending quote', async () => {
      await seedQuote()
      const res = await asCustomer().post(`/quotes/${WO}/reject`).expect(201)
      expect(res.body).toMatchObject({ workOrderId: WO, status: 'REJECTED' })
    })
  })

  describe('GET /payments/:workOrderId', () => {
    it('returns 404 when there is no payment', async () => {
      await asAdmin().get(`/payments/${MISSING}`).expect(404)
    })
  })

  describe('authorization', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get(`/quotes/${WO}`).expect(401)
    })
  })
})
