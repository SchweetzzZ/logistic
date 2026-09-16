import { Controller, Post, Patch, Get, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, } from '@nestjs/swagger';
import { carrierService } from './carrier.service';
import { CreateCarrierDto, UpdateCarrierDto } from './dto/carrier-dto';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Carriers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('carriers')
export class carrierController {
    constructor(private readonly carrierService: carrierService) { }

    @Post()
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Cadastrar nova transportadora' })
    async create(@CurrentTenant() tenantId: string, @Body() data: CreateCarrierDto,) {
        return this.carrierService.create(tenantId, data);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Atualizar transportadora' })
    async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() data: UpdateCarrierDto,) {
        return this.carrierService.update(tenantId, id, data);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Remover transportadora' })
    async remove(@CurrentTenant() tenantId: string, @Param('id') id: string,) {
        return this.carrierService.remove(tenantId, id);
    }

    @Get()
    @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
    @ApiOperation({ summary: 'Listar todas as transportadoras' })
    async findAll(@CurrentTenant() tenantId: string,) {
        return this.carrierService.findAll(tenantId);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
    @ApiOperation({ summary: 'Buscar transportadora por ID' })
    async findById(@CurrentTenant() tenantId: string, @Param('id') id: string,) {
        return this.carrierService.findById(tenantId, id);
    }

}