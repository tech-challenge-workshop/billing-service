import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BillingModule } from './modules/billing/billing.module'
import { AuthModule } from './shared/auth/auth.module'
import { validateEnv } from './shared/config/env'
import { PrismaModule } from './shared/database/prisma.module'
import { HealthController } from './shared/health/health.controller'
import { MessagingModule } from './shared/messaging/messaging.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    MessagingModule,
    PrismaModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
