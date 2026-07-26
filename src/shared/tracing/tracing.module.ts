import { Global, Module } from '@nestjs/common'
import { TRACING_PORT } from './tracing.port'
import { DatadogTracingService } from './datadog-tracing.service'

@Global()
@Module({
  providers: [{ provide: TRACING_PORT, useClass: DatadogTracingService }],
  exports: [TRACING_PORT],
})
export class TracingModule {}
