import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { carrierService } from './carrier.service';
import {
  CreateCarrierDto,
  UpdateCarrierDto,
  CarrierResponseDto,
  CarrierMessageResponseDto,
} from './dto/carrier-dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Carriers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('carriers')
export class carrierController {
  constructor(private readonly carrierService: carrierService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cadastrar nova transportadora' })
  @ApiCreatedResponse({
    type: CarrierResponseDto,
    description: 'Transportadora cadastrada com sucesso',
  })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() data: CreateCarrierDto,
  ): Promise<CarrierResponseDto> {
    return this.carrierService.create(tenantId, data, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Atualizar transportadora' })
  @ApiOkResponse({
    type: CarrierResponseDto,
    description: 'Transportadora atualizada com sucesso',
  })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateCarrierDto,
  ): Promise<CarrierResponseDto> {
    return this.carrierService.update(tenantId, id, data, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Remover transportadora' })
  @ApiOkResponse({
    type: CarrierMessageResponseDto,
    description: 'Transportadora removida com sucesso',
  })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<CarrierMessageResponseDto> {
    return this.carrierService.remove(tenantId, id, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Listar todas as transportadoras' })
  @ApiOkResponse({
    type: [CarrierResponseDto],
    description: 'Lista de transportadoras da empresa',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
  ): Promise<CarrierResponseDto[]> {
    return this.carrierService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Buscar transportadora por ID' })
  @ApiOkResponse({
    type: CarrierResponseDto,
    description: 'Dados detalhados da transportadora',
  })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<CarrierResponseDto> {
    return this.carrierService.findById(tenantId, id);
  }
}
