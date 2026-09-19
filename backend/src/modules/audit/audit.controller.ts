import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditFilterDto, AuditLogPaginatedResponseDto, AuditLogDetailResponseDto, } from './dto/audit.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Listar registros de auditoria do sistema com filtros e paginação (ADMIN e MANAGER)',
  })
  @ApiOkResponse({
    type: AuditLogPaginatedResponseDto,
    description: 'Lista paginada de registros de auditoria com dados do usuário',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() filters: AuditFilterDto,
  ): Promise<AuditLogPaginatedResponseDto> {
    return this.auditService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Buscar detalhes de um registro de auditoria por ID (ADMIN e MANAGER)',
  })
  @ApiOkResponse({
    type: AuditLogDetailResponseDto,
    description: 'Detalhes do registro de auditoria',
  })
  async findById(@CurrentTenant() tenantId: string, @Param('id') id: string,): Promise<AuditLogDetailResponseDto> {
    return this.auditService.findById(tenantId, id);
  }
}
