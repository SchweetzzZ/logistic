import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FreightService } from './freight.service';
import {
  SimulateFreightDto,
  SimulateFreightResponseDto,
  FreightHistoryResponseDto,
} from './dto/freight.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/access-control/permissions';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Freight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('freight')
export class FreightController {
  constructor(private readonly freightService: FreightService) {}

  @Post('simulate')
  @RequirePermission(PERMISSIONS.freight.simulate)
  @ApiOperation({
    summary: 'Simular frete considerando peso, cubagem, distância e seguro',
    description:
      'Calcula cotações de frete comparando todas as transportadoras ativas da empresa e grava auditoria.',
  })
  @ApiOkResponse({
    type: SimulateFreightResponseDto,
    description: 'Cotações de frete calculadas com sucesso',
  })
  async simulate(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: SimulateFreightDto,
  ): Promise<SimulateFreightResponseDto> {
    return this.freightService.simulateFreight(tenantId, dto, userId);
  }

  @Get('history')
  @RequirePermission(PERMISSIONS.freight.read)
  @ApiOperation({
    summary: 'Listar histórico de simulações de frete realizadas na empresa',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: FreightHistoryResponseDto,
    description: 'Histórico paginado de simulações de frete',
  })
  async getHistory(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<FreightHistoryResponseDto> {
    return this.freightService.getHistory(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
