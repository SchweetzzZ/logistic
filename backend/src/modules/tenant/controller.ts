import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { TenantService } from './service';
import { TenantResponseDto, UpdateTenantDto } from './dto/tenant.dto';
import { Tenant } from './schemas/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  private toResponseDto(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      document: tenant.document,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }

  @Get('current')
  @ApiOperation({ summary: 'Obter dados da empresa (tenant) da sessão atual' })
  @ApiOkResponse({
    type: TenantResponseDto,
    description: 'Dados da empresa vinculada ao usuário logado',
  })
  async getCurrentTenant(
    @CurrentTenant() tenantId: string,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantService.findById(tenantId);
    return this.toResponseDto(tenant);
  }

  @Patch('current')
  @Roles(Role.ADMIN)
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
    const tenant = await this.tenantService.update(tenantId, dto);
    return this.toResponseDto(tenant);
  }
}
