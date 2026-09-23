import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, ne } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { users } from './schemas/schema';
import { CreateUserDto, UpdateUserDto, UserResponseDto, MessageResponseDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';
import { toSafeUser } from './user.helpers';

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
  ) { }

  async createEmployee(tenantId: string, dto: CreateUserDto, currentUserId?: string): Promise<UserResponseDto> {
    const [existing] = await this.db.select().from(users).where
      (and(eq(users.tenantId, tenantId), eq(users.email, dto.email))).limit(1);

    if (existing) {
      throw new ConflictException('Já existe um colaborador cadastrado com este e-mail nesta empresa');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.db.insert(users).values({
      ...dto,
      passwordHash,
      tenantId,
    });

    const [created] = await this.db.select().from(users).where
      (and(eq(users.tenantId, tenantId), eq(users.email, dto.email))).limit(1);

    await this.auditService.log({
      tenantId,
      userId: currentUserId ?? null,
      action: 'USER_CREATE',
      resource: 'user',
      resourceId: created.id,
      details: { name: created.name, email: created.email, role: created.role },
    });

    return toSafeUser(created);
  }

  async findMe(userId: string): Promise<UserResponseDto> {
    const [user] = await this.db.select().from(users).where
      (eq(users.id, userId)).limit(1);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return toSafeUser(user);
  }

  async findAllByTenant(tenantId: string): Promise<UserResponseDto[]> {
    const list = await this.db.select().from(users).where
      (eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));

    return list.map(toSafeUser);
  }

  async update(tenantId: string, targetUserId: string, dto: UpdateUserDto, currentUserId?: string): Promise<UserResponseDto> {
    const [targetUser] = await this.db.select().from(users).where
      (and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    if (dto.email && dto.email !== targetUser.email) {
      const [existing] = await this.db.select().from(users).where
        (and(eq(users.tenantId, tenantId), eq(users.email, dto.email), ne(users.id, targetUserId))).limit(1);

      if (existing) {
        throw new ConflictException('Já existe outro colaborador com este e-mail nesta empresa');
      }
    }

    // 1. Calcular diff real apenas dos campos efetivamente modificados
    type FieldDiff = { from: string | null; to: string };
    const diff: Record<string, FieldDiff> = {};

    if (dto.name !== undefined && dto.name !== targetUser.name) {
      diff.name = { from: targetUser.name, to: dto.name };
    }
    if (dto.email !== undefined && dto.email !== targetUser.email) {
      diff.email = { from: targetUser.email, to: dto.email };
    }
    if (dto.role !== undefined && dto.role !== targetUser.role) {
      diff.role = { from: targetUser.role, to: dto.role };
    }
    if (dto.password !== undefined) {
      diff.password = { from: '[ANTERIOR]', to: '[REDEFINIDA]' };
    }

    // Se nenhum campo foi modificado, encerra sem alterar banco nem gerar log
    if (Object.keys(diff).length === 0) {
      return toSafeUser(targetUser);
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

    await this.db.update(users).set(updateData).where
      (and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));

    const [updated] = await this.db.select().from(users).where
      (and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    const isRoleChanged = Boolean(diff.role);

    await this.auditService.log({
      tenantId,
      userId: currentUserId ?? null,
      action: isRoleChanged ? 'USER_ROLE_CHANGE' : 'USER_UPDATE',
      resource: 'user',
      resourceId: targetUserId,
      details: {
        diff,
      },
    });

    return toSafeUser(updated);
  }

  async remove(tenantId: string, currentUserId: string, targetUserId: string): Promise<MessageResponseDto> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Você não pode remover seu próprio usuário da sessão');
    }

    const [targetUser] = await this.db.select().from(users).where
      (and(eq(users.id, targetUserId), eq(users.tenantId, tenantId))).limit(1);

    if (!targetUser) {
      throw new NotFoundException('Colaborador não encontrado nesta empresa');
    }

    await this.db.delete(users).where
      (and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)));

    await this.auditService.log({
      tenantId,
      userId: currentUserId,
      action: 'USER_DELETE',
      resource: 'user',
      resourceId: targetUserId,
      details: {
        removedUserName: targetUser.name,
        removedUserEmail: targetUser.email,
        removedUserRole: targetUser.role,
      },
    });

    return { message: 'Colaborador removido com sucesso' };
  }
}
