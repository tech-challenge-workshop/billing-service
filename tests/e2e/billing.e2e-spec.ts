import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const WO = '390a5b7c-1111-4abc-8def-000000000001'
const MISSING = '00000000-0000-4000-8000-000000000000'

describe('Billing (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

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

  const http = () => request(app.getHttpServer())

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
      const res = await http().get(`/quotes/${WO}`).expect(200)
      expect(res.body).toMatchObject({ workOrderId: WO, amountCents: 30000, status: 'PENDING' })
    })

    it('returns 404 when missing', async () => {
      await http().get(`/quotes/${MISSING}`).expect(404)
    })
  })

  describe('POST /quotes/:workOrderId/approve', () => {
    it('approves a pending quote', async () => {
      await seedQuote()
      const res = await http().post(`/quotes/${WO}/approve`).expect(201)
      expect(res.body).toMatchObject({ workOrderId: WO, status: 'APPROVED' })
    })

    it('returns 400 when approving an already approved quote', async () => {
      await seedQuote('APPROVED')
      await http().post(`/quotes/${WO}/approve`).expect(400)
    })

    it('returns 404 when the quote does not exist', async () => {
      await http().post(`/quotes/${MISSING}/approve`).expect(404)
    })
  })

  describe('POST /quotes/:workOrderId/reject', () => {
    it('rejects a pending quote', async () => {
      await seedQuote()
      const res = await http().post(`/quotes/${WO}/reject`).expect(201)
      expect(res.body).toMatchObject({ workOrderId: WO, status: 'REJECTED' })
    })
  })

  describe('GET /payments/:workOrderId', () => {
    it('returns 404 when there is no payment', async () => {
      await http().get(`/payments/${MISSING}`).expect(404)
    })
  })
})
