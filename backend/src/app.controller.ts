import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/common/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Healthcheck da API' })
  @ApiOkResponse({
    description: 'Retorna mensagem de status da API',
    schema: {
      type: 'string',
      example: 'Logistics SaaS API Enterprise is running!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
