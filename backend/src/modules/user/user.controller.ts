import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, MessageResponseDto } from './dto/user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/access-control/permissions';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Obter dados do usuário da sessão atual' })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Dados do perfil do usuário autenticado',
  })
  async getMe(@CurrentUser('userId') userId: string): Promise<UserResponseDto> {
    return this.userService.findMe(userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.users.create)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Criar novo colaborador na empresa atual (Restrito a ADMIN)',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'Colaborador cadastrado com sucesso',
  })
  async createEmployee(@CurrentTenant() tenantId: string, @CurrentUser('userId') currentUserId: string, @Body() dto: CreateUserDto,): Promise<UserResponseDto> {
    return this.userService.createEmployee(tenantId, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.users.read)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Listar colaboradores da mesma empresa (ADMIN e MANAGER)',
  })
  @ApiOkResponse({
    type: [UserResponseDto],
    description: 'Lista de usuários do tenant atual',
  })
  async listUsers(@CurrentTenant() tenantId: string,): Promise<UserResponseDto[]> {
    return this.userService.findAllByTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.users.update)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados de um colaborador (Restrito a ADMIN)',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Colaborador atualizado com sucesso',
  })
  async updateEmployee(@CurrentTenant() tenantId: string, @CurrentUser('userId') currentUserId: string, @Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(tenantId, id, dto, currentUserId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.users.delete)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover um colaborador da empresa (Restrito a ADMIN)',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Colaborador removido com sucesso',
  })
  async removeEmployee(@CurrentTenant() tenantId: string, @CurrentUser('userId') currentUserId: string, @Param('id') id: string): Promise<MessageResponseDto> {
    return this.userService.remove(tenantId, currentUserId, id);
  }
}
