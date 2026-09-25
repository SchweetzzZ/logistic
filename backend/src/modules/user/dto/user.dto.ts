import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '../../common/enums/role.enum';

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z
    .enum([Role.ADMIN, Role.MANAGER, Role.OPERATOR])
    .default(Role.OPERATOR),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) { }

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .optional(),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido')
    .optional(),
  role: z.enum([Role.ADMIN, Role.MANAGER, Role.OPERATOR]).optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }

export const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  tenantId: z.string(),
  authProvider: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) { }

// Re-export common message response DTOs
export {
  MessageResponseSchema,
  MessageResponseDto,
} from '../../common/dto/message-response.dto';

// Re-export auth DTOs for backward compatibility
export {
  RegisterTenantSchema,
  RegisterTenantDto,
  LoginSchema,
  LoginDto,
  RefreshTokenSchema,
  RefreshTokenDto,
  AuthResponseSchema,
  AuthResponseDto,
  RegisterOAuthTenantSchema,
  RegisterOAuthTenantDto,
} from '../../auth/dto/auth.dto';
