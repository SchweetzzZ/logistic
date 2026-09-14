import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { UserService } from './user.service';
import {
  RegisterTenantDto,
  LoginDto,
  CreateUserDto,
  UpdateUserDto,
  RefreshTokenDto,
  UserResponseDto,
  AuthResponseDto,
  MessageResponseDto,
} from './dto/user.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Users & Auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax' });
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Auto-cadastro: cria a Empresa (Tenant) e o usuário ADMIN',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'Empresa e Administrador cadastrados com sucesso',
  })
  async register(
    @Body() dto: RegisterTenantDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.userService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Autenticar com email e senha (emite cookies HttpOnly e Bearer)',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Login bem-sucedido com cookies emitidos',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.userService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Renovar Access Token via Refresh Token (cookie ou body)',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Sessão renovada com sucesso',
  })
  async refreshToken(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token: string | undefined =
      cookies?.['refresh_token'] || dto.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const result = await this.userService.refreshToken(token);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({
    summary: 'Encerrar sessão, revogar refresh token e limpar cookies',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Logout efetuado com sucesso',
  })
  async logout(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    this.clearAuthCookies(res);
    return this.userService.logout(userId);
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Criar novo colaborador na empresa atual (Restrito a ADMIN)',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'Colaborador cadastrado com sucesso',
  })
  async createEmployee(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.createEmployee(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Listar colaboradores da mesma empresa (ADMIN e MANAGER)',
  })
  @ApiOkResponse({
    type: [UserResponseDto],
    description: 'Lista de usuários do tenant atual',
  })
  async listUsers(
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto[]> {
    return this.userService.findAllByTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar dados de um colaborador (Restrito a ADMIN)',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Colaborador atualizado com sucesso',
  })
  async updateEmployee(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(tenantId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover um colaborador da empresa (Restrito a ADMIN)',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Colaborador removido com sucesso',
  })
  async removeEmployee(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') currentUserId: string,
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return this.userService.remove(tenantId, currentUserId, id);
  }
}
