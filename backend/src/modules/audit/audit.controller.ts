import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditFilterDto } from './dto/audit.dto';
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
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Listar registros de auditoria do sistema com filtros e paginação (ADMIN e MANAGER)',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() filters: AuditFilterDto,
  ) {
    return this.auditService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Buscar detalhes de um registro de auditoria por ID (ADMIN e MANAGER)',
  })
  async findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.auditService.findById(tenantId, id);
  }
}
