import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/public.decorator'

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  check(): { status: string; service: string } {
    return { status: 'ok', service: 'billing-service' }
  }
}
