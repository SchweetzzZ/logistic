import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { users, type User } from '../user/schemas/schema';
import { tenants } from '../tenant/schemas/schema';
import { Role } from '../common/enums/role.enum';
import { authConfig } from '../../config/auth.config';
import { RegisterTenantDto, LoginDto, RegisterOAuthTenantDto } from './dto/auth.dto';
import { UserResponseDto } from '../user/dto/user.dto';
import { toSafeUser } from '../user/user.helpers';
import { AuditService } from '../audit/audit.service';
import type { OAuthUserPayload } from '../common/strategies/google.strategy';

export interface OAuthLoginResult {
  isNewUser: boolean;
  onboardingToken?: string;
  profile?: OAuthUserPayload;
  user?: UserResponseDto;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
    private readonly auditService: AuditService,
  ) { }

  private generateTokens(user: User): { accessToken: string; refreshToken: string; } {
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

  async register(dto: RegisterTenantDto): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    // 1. Verificar se já existe empresa com este documento
    const [existingTenant] = await this.db.select().from(tenants).where
      (eq(tenants.document, dto.document)).limit(1);

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

      const [tenant] = await tx.select().from(tenants).where
        (eq(tenants.document, dto.document)).limit(1);

      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Inserir Admin da Empresa
      await tx.insert(users).values({
        name: dto.adminName,
        email: dto.email,
        passwordHash,
        role: Role.ADMIN,
        tenantId: tenant.id,
      });

      const [admin] = await tx.select().from(users).where
        (and(eq(users.tenantId, tenant.id), eq(users.email, dto.email))).limit(1);

      // Emissão de tokens
      const { accessToken, refreshToken } = this.generateTokens(admin);

      // Armazenar hash do refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await tx.update(users).set({ refreshTokenHash }).where
        (eq(users.id, admin.id));

      return {
        user: toSafeUser(admin),
        accessToken,
        refreshToken,
      };
    });
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    const [user] = await this.db.select().from(users).where
      (eq(users.email, dto.email)).limit(1);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        `Esta conta foi vinculada via ${user.authProvider || 'login social'}. Por favor, faça login utilizando o botão correspondente.`,
      );
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
    await this.db.update(users).set({ refreshTokenHash }).where
      (eq(users.id, user.id));

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'AUTH_LOGIN',
      resource: 'auth',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { email: user.email, role: user.role, provider: 'LOCAL' },
    });

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }


  //Se o usuário já existe: efetua login direto ou exige MFA se estiver habilitado.
  //Se o usuário NÃO existe: gera um token de onboarding temporário para que ele conclua informando o CNPJ da empresa.

  async handleOAuthLogin(profile: OAuthUserPayload, ipAddress?: string, userAgent?: string): Promise<OAuthLoginResult> {
    const [user] = await this.db.select().from(users).where
      (eq(users.email, profile.email)).limit(1);

    if (!user) {
      // Usuário novo: emite token temporário de onboarding assinado
      const onboardingToken = this.jwtService.sign(
        {
          email: profile.email,
          name: profile.name,
          provider: profile.provider,
          providerId: profile.providerId,
          onboarding: true,
        },
        {
          secret: this.authConfiguration.jwtSecret,
          expiresIn: '15m',
        },
      );

      return {
        isNewUser: true,
        onboardingToken,
        profile,
      };
    }

    // Se o usuário existente ainda não tinha providerId gravado, vincula agora
    if (!user.providerId || user.authProvider === 'LOCAL') {
      await this.db.update(users).set({
        authProvider: profile.provider,
        providerId: profile.providerId,
      }).where
        (eq(users.id, user.id));
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.db.update(users).set({ refreshTokenHash }).where
      (eq(users.id, user.id));

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'AUTH_LOGIN',
      resource: 'auth',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: {
        email: user.email,
        role: user.role,
        provider: profile.provider,
      },
    });

    return {
      isNewUser: false,
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Conclui o cadastro da nova empresa e usuário originados via OAuth (com CNPJ preenchido).
   */
  async registerOAuthTenant(dto: RegisterOAuthTenantDto, ipAddress?: string, userAgent?: string): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
    let payload: {
      email: string;
      name: string;
      provider: 'GOOGLE' | 'GITHUB';
      providerId: string;
      onboarding: boolean;
    };

    try {
      payload = this.jwtService.verify(dto.onboardingToken, {
        secret: this.authConfiguration.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Token de cadastro social expirado ou inválido. Inicie o fluxo novamente.',
      );
    }

    if (!payload.onboarding || !payload.email) {
      throw new UnauthorizedException('Token de cadastro inválido');
    }

    // 1. Verificar se já existe empresa com este documento
    const [existingTenant] = await this.db.select().from(tenants).where
      (eq(tenants.document, dto.document)).limit(1);

    if (existingTenant) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada com este documento (CNPJ)',
      );
    }

    // 2. Verificar se o e-mail já existe
    const [existingUser] = await this.db.select().from(users).where
      (eq(users.email, payload.email)).limit(1);

    if (existingUser) {
      throw new ConflictException(
        'Este e-mail já possui uma conta ativa no sistema.',
      );
    }

    const tenantId = randomUUID();
    const adminId = randomUUID();

    const createdAdmin = await this.db.transaction(async (tx) => {
      // Inserir Tenant
      await tx.insert(tenants).values({
        id: tenantId,
        name: dto.companyName,
        document: dto.document,
      });

      // Inserir Admin via OAuth
      await tx.insert(users).values({
        id: adminId,
        name: payload.name,
        email: payload.email,
        authProvider: payload.provider,
        providerId: payload.providerId,
        role: Role.ADMIN,
        tenantId,
      });

      const [admin] = await tx.select().from(users).where
        (eq(users.id, adminId)).limit(1);

      return admin;
    });

    const { accessToken, refreshToken } = this.generateTokens(createdAdmin);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.db.update(users).set({ refreshTokenHash }).where
      (eq(users.id, adminId));

    await this.auditService.log({
      tenantId,
      userId: adminId,
      action: 'USER_CREATE',
      resource: 'user',
      resourceId: adminId,
      ipAddress,
      userAgent,
      details: {
        companyName: dto.companyName,
        document: dto.document,
        email: payload.email,
        provider: payload.provider,
      },
    });

    return {
      user: toSafeUser(createdAdmin),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token?: string): Promise<{ user: UserResponseDto; accessToken: string; refreshToken: string }> {
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

    const [user] = await this.db.select().from(users).where
      (eq(users.id, payload.sub)).limit(1);

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

    await this.db.update(users).set({ refreshTokenHash: newRefreshTokenHash }).where
      (eq(users.id, user.id));

    return {
      user: toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, tenantId?: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    await this.db.update(users).set({ refreshTokenHash: null }).where
      (eq(users.id, userId));

    await this.auditService.log({
      tenantId: tenantId ?? null,
      userId,
      action: 'AUTH_LOGOUT',
      resource: 'auth',
      resourceId: userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Logout realizado com sucesso' };
  }
}
