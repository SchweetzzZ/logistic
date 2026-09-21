import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { CustomerManagementService } from './customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  MessageResponseDto,
  CustomerImportResponseDto,
} from './dto/customer-manegement-dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomerManagementController {
  constructor(private readonly customerService: CustomerManagementService) {}

  @Post('import')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar clientes em massa via arquivo CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo CSV com os dados dos clientes',
        },
      },
    },
  })
  @ApiOkResponse({
    type: CustomerImportResponseDto,
    description: 'Resultado da importação em lote com contadores e erros',
  })
  async importCsv(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CustomerImportResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Nenhum arquivo CSV foi enviado.');
    }
    return this.customerService.importCsv(
      tenantId,
      file.buffer,
      userId,
      file.originalname,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Cadastrar novo cliente na empresa atual' })
  @ApiCreatedResponse({
    type: CustomerResponseDto,
    description: 'Cliente cadastrado com sucesso',
  })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.create(tenantId, dto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar clientes da empresa atual (com busca opcional)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filtrar por nome, CPF ou e-mail',
  })
  @ApiOkResponse({
    type: [CustomerResponseDto],
    description: 'Lista de clientes do tenant atual',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
  ): Promise<CustomerResponseDto[]> {
    return this.customerService.findAll(tenantId, search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiOkResponse({
    type: CustomerResponseDto,
    description: 'Dados detalhados do cliente',
  })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<CustomerResponseDto> {
    return this.customerService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Atualizar dados de um cliente' })
  @ApiOkResponse({
    type: CustomerResponseDto,
    description: 'Cliente atualizado com sucesso',
  })
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerService.update(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Remover um cliente (Restrito a ADMIN e MANAGER)' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Cliente removido com sucesso',
  })
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return this.customerService.remove(tenantId, id, userId);
  }
}
