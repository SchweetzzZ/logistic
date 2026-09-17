import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FreightService } from './freight.service';
import { SimulateFreightDto } from './dto/freight.dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Freight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('freight')
export class FreightController {
  constructor(private readonly freightService: FreightService) { }

  @Post('simulate')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Simular frete considerando peso, cubagem, distância e seguro',
    description:
      'Calcula cotações de frete comparando todas as transportadoras ativas da empresa.',
  })
  async simulate(@CurrentTenant() tenantId: string, @Body() dto: SimulateFreightDto) {
    return this.freightService.simulateFreight(tenantId, dto);
  }
}
