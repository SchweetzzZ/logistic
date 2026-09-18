import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FreightService } from './freight.service';
import { SimulateFreightDto } from './dto/freight.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Freight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('freight')
export class FreightController {
  constructor(private readonly freightService: FreightService) {}

  @Post('simulate')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Simular frete considerando peso, cubagem, distância e seguro',
    description:
      'Calcula cotações de frete comparando todas as transportadoras ativas da empresa e grava auditoria.',
  })
  async simulate(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: SimulateFreightDto,
  ) {
    return this.freightService.simulateFreight(tenantId, dto, userId);
  }

  @Get('history')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar histórico de simulações de frete realizadas na empresa',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.freightService.getHistory(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
