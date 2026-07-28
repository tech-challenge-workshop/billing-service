import './tracer'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { DatadogLoggerService } from './shared/observability/datadog-logger.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useLogger(new DatadogLoggerService())
  const config = app.get(ConfigService)

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('billing-service')
    .setDescription('Quotes and payments (Mercado Pago) — FIAP Tech Challenge (Phase 4)')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.getOrThrow<number>('PORT'))
}
void bootstrap()
