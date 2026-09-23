import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { TenantResponseDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/access-control/permissions';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('current')
  @RequirePermission(PERMISSIONS.tenants.read)
  @ApiOperation({ summary: 'Obter dados da empresa (tenant) da sessão atual' })
  @ApiOkResponse({
    type: TenantResponseDto,
    description: 'Dados da empresa vinculada ao usuário logado',
  })
  async getCurrentTenant(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantResponseDto> {
    return this.tenantService.findById(tenantId);
  }

  @Patch('current')
  @RequirePermission(PERMISSIONS.tenants.update)
  @ApiOperation({
    summary: 'Atualizar dados da empresa (exclusivo para Administradores)',
  })
  @ApiOkResponse({
    type: TenantResponseDto,
    description: 'Empresa atualizada com sucesso',
  })
  async updateCurrentTenant(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(tenantId, dto);
  }
}
