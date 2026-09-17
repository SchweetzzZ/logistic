import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '../../common/enums/role.enum';

export const RegisterTenantSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'O nome da empresa deve ter no mínimo 2 caracteres')
    .max(150, 'O nome da empresa deve ter no máximo 150 caracteres'),
  document: z
    .string()
    .trim()
    .min(8, 'O documento deve ter no mínimo 8 caracteres')
    .max(20, 'O documento deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9.\-/]+$/, 'Documento com formato inválido'),
  adminName: z
    .string()
    .trim()
    .min(2, 'O nome do administrador deve ter no mínimo 2 caracteres')
    .max(100, 'O nome do administrador deve ter no máximo 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export class RegisterTenantDto extends createZodDto(RegisterTenantSchema) {}

export const CreateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z
    .enum([Role.ADMIN, Role.MANAGER, Role.OPERATOR])
    .default(Role.OPERATOR),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UpdateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail em formato inválido')
    .optional(),
  role: z.enum([Role.ADMIN, Role.MANAGER, Role.OPERATOR]).optional(),
  password: z
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export class LoginDto extends createZodDto(LoginSchema) {}

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

export const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  tenantId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  accessToken: z.string(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

export const MessageResponseSchema = z.object({
  message: z.string(),
});

export class MessageResponseDto extends createZodDto(MessageResponseSchema) {}
