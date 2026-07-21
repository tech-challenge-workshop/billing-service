import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from './shared/config/env'
import { PrismaModule } from './shared/database/prisma.module'
import { HealthController } from './shared/health/health.controller'
import { MessagingModule } from './shared/messaging/messaging.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MessagingModule,
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
