import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and, desc, ne } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { users, User } from './schemas/schema';
import { tenants } from '../tenant/schemas/schema';
import { Role } from '../common/enums/role.enum';
import { authConfig } from '../../config/auth.config';
import { RegisterTenantDto, CreateUserDto, UpdateUserDto, LoginDto, UserResponseDto } from './dto/user.dto';

const toSafeUser = ({ passwordHash, refreshTokenHash, ...user }: User): UserResponseDto => user;

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) { }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken: string = this.jwtService.sign(payload, {
      secret: this.authConfiguration.jwtSecret,
      expiresIn: this.authConfiguration.jwtExpiresIn,
    });

    const refreshPayload = {
      sub: user.id,
      tenantId: user.tenantId,
    };

    const refreshToken: string = this.jwtService.sign(refreshPayload, {
      secret: this.authConfiguration.refreshTokenSecret,
      expiresIn: this.authConfiguration.refreshTokenExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterTenantDto) {
    // 1. Verificar se já existe empresa com este documento
    const [existingTenant] = await this.db.select().from(tenants)
      .where(eq(tenants.document, dto.document))
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
        name: dto.companyName,
        document: dto.document,
      });

      const [tenant] = await tx.select().from(tenants)
        .where(eq(tenants.document, dto.document))
        .limit(1);

      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Inserir Admin da Empresa
      await tx.insert(users).values({
        name: dto.adminName,
        email: dto.email,
        passwordHash,
        role: Role.ADMIN,
        tenantId: tenant.id,
      });

      const [admin] = await tx.select().from(users)
        .where(and(eq(users.tenantId, tenant.id), eq(users.email, dto.email)))
        .limit(1);

      // Emissão de tokens
      const { accessToken, refreshToken } = this.generateTokens(admin);

      // Armazenar hash do refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await tx.update(users).set({ refreshTokenHash }).where(eq(users.id, admin.id));

      return {
        user: toSafeUser(admin),
        accessToken,
        refreshToken,
      };
    });
  }

  async login(dto: LoginDto) {
    const [user] = await this.db.select().from(users)
      .where(eq(users.email, dto.email))
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
    await this.db.update(users).set({ refreshTokenHash }).where(eq(users.id, user.id));

    return {
      user: toSafeUser(user),
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
        secret: this.authConfiguration.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido');
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);

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

    await this.db.update(users).set({ refreshTokenHash: newRefreshTokenHash }).where(eq(users.id, user.id));

    return {
      user: toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.db.update(users).set({ refreshTokenHash: null }).where(eq(users.id, userId));

    return { message: 'Logout realizado com sucesso' };
  }

  async createEmployee(tenantId: string, dto: CreateUserDto) {
    const [existing] = await this.db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, dto.email))).limit(1);

    if (existing) {
      throw new ConflictException(
        'Já existe um colaborador cadastrado com este e-mail nesta empresa',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.db.insert(users).values({
      ...dto,
      passwordHash,
      tenantId,
    });

    const [created] = await this.db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, dto.email))).limit(1);

    return toSafeUser(created);
  }

  async findMe(userId: string): Promise<UserResponseDto> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return toSafeUser(user);
  }

  async findAllByTenant(tenantId: string): Promise<UserResponseDto[]> {
    const list = await this.db.select().from(users).where(eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));

    return list.map(toSafeUser);
  }

  async update(tenantId: string, targetUserId: string, dto: UpdateUserDto,): Promise<UserResponseDto> {
    const [targetUser] = await this.db.select().from(users).where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    if (dto.email && dto.email !== targetUser.email) {
      const [existing] = await this.db.select().from(users).where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.email, dto.email),
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

    const { password, ...rest } = dto;
    const updateData: Partial<typeof users.$inferInsert> = {
      ...rest,
      ...(password
        ? {
          passwordHash: await bcrypt.hash(password, 10),
          refreshTokenHash: null,
        }
        : {}),
    };

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(users)
        .set(updateData)
        .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));
    }

    const [updated] = await this.db.select().from(users).where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    return toSafeUser(updated);
  }

  async remove(tenantId: string, currentUserId: string, targetUserId: string,): Promise<{ message: string }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Você não pode remover seu próprio usuário da sessão');
    }

    const [targetUser] = await this.db.select().from(users).where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    await this.db
      .delete(users)
      .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));

    return { message: 'Colaborador removido com sucesso' };
  }
}
