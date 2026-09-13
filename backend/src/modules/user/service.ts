import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and, desc, ne } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { users, User } from './schemas/schema';
import { tenants } from '../tenant/schemas/schema';
import { Role } from '../common/enums/role.enum';
import {
  RegisterTenantDto,
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  UserResponseDto,
} from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'super_secret_jwt_key_change_in_production_logistics_saas_2026';
    this.jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'super_secret_refresh_token_key_change_in_production_2026';
    this.refreshTokenExpiresIn =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';
  }

  private sanitizeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken: string = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.jwtExpiresIn as any,
    });

    const refreshPayload = {
      sub: user.id,
      tenantId: user.tenantId,
    };

    const refreshToken: string = this.jwtService.sign(refreshPayload, {
      secret: this.refreshTokenSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.refreshTokenExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterTenantDto) {
    const document = dto.document.trim();
    const email = dto.email.trim().toLowerCase();

    // 1. Verificar se já existe empresa com este documento
    const [existingTenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.document, document))
      .limit(1);

    if (existingTenant) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada com este documento',
      );
    }

    // 2. Executar transação ACID no MySQL via Drizzle
    return this.db.transaction(async (tx) => {
      // Inserir Tenant
      await tx.insert(tenants).values({
        name: dto.companyName.trim(),
        document,
      });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.document, document))
        .limit(1);

      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Inserir Admin da Empresa
      await tx.insert(users).values({
        name: dto.adminName.trim(),
        email,
        passwordHash,
        role: Role.ADMIN,
        tenantId: tenant.id,
      });

      const [admin] = await tx
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenant.id), eq(users.email, email)))
        .limit(1);

      // Emissão de tokens
      const { accessToken, refreshToken } = this.generateTokens(admin);

      // Armazenar hash do refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await tx
        .update(users)
        .set({ refreshTokenHash })
        .where(eq(users.id, admin.id));

      return {
        user: this.sanitizeUser(admin),
        accessToken,
        refreshToken,
      };
    });
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    // Hash e rotação do refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.db
      .update(users)
      .set({ refreshTokenHash })
      .where(eq(users.id, user.id));

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token não informado');
    }

    let payload: { sub: string; tenantId: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sessão revogada ou usuário inexistente');
    }

    const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token revogado ou inválido');
    }

    // Rotação segura de tokens
    const tokens = this.generateTokens(user);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.db
      .update(users)
      .set({ refreshTokenHash: newRefreshTokenHash })
      .where(eq(users.id, user.id));

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.db
      .update(users)
      .set({ refreshTokenHash: null })
      .where(eq(users.id, userId));

    return { message: 'Logout realizado com sucesso' };
  }

  async createEmployee(tenantId: string, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const [existing] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.email, email)))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'Já existe um colaborador cadastrado com este e-mail nesta empresa',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.db.insert(users).values({
      name: dto.name.trim(),
      email,
      passwordHash,
      role: dto.role,
      tenantId,
    });

    const [created] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.email, email)))
      .limit(1);

    return this.sanitizeUser(created);
  }

  async findMe(userId: string): Promise<UserResponseDto> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.sanitizeUser(user);
  }

  async findAllByTenant(tenantId: string): Promise<UserResponseDto[]> {
    const list = await this.db
      .select()
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt));

    return list.map((u) => this.sanitizeUser(u));
  }

  async update(
    tenantId: string,
    targetUserId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const [targetUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    if (dto.email) {
      const newEmail = dto.email.trim().toLowerCase();
      if (newEmail !== targetUser.email) {
        const [existing] = await this.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.tenantId, tenantId),
              eq(users.email, newEmail),
              ne(users.id, targetUserId),
            ),
          )
          .limit(1);

        if (existing) {
          throw new ConflictException(
            'Já existe outro colaborador com este e-mail nesta empresa',
          );
        }
      }
    }

    const updateData: Partial<typeof users.$inferInsert> = {};

    if (dto.name) {
      updateData.name = dto.name.trim();
    }
    if (dto.email) {
      updateData.email = dto.email.trim().toLowerCase();
    }
    if (dto.role) {
      updateData.role = dto.role;
    }
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
      updateData.refreshTokenHash = null;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(users)
        .set(updateData)
        .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));
    }

    const [updated] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)))
      .limit(1);

    return this.sanitizeUser(updated);
  }

  async remove(
    tenantId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Você não pode remover seu próprio usuário da sessão',
      );
    }

    const [targetUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    await this.db
      .delete(users)
      .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));

    return { message: 'Colaborador removido com sucesso' };
  }
}
