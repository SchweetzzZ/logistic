import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserResponseSchema } from '../../user/dto/user.dto';

export {
  MessageResponseSchema,
  MessageResponseDto,
} from '../../common/dto/message-response.dto';

export const RegisterTenantSchema = z.object({
  companyName: z.string().trim().min(2, 'O nome da empresa deve ter no mínimo 2 caracteres').max(150, 'O nome da empresa deve ter no máximo 150 caracteres'),
  document: z.string().trim().min(8, 'O documento deve ter no mínimo 8 caracteres')
    .max(20, 'O documento deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9.\-/]+$/, 'Documento com formato inválido'),
  adminName: z.string().trim()
    .min(2, 'O nome do administrador deve ter no mínimo 2 caracteres')
    .max(100, 'O nome do administrador deve ter no máximo 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export class RegisterTenantDto extends createZodDto(RegisterTenantSchema) { }

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export class LoginDto extends createZodDto(LoginSchema) { }

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) { }

export const AuthResponseSchema = z.object({
  user: UserResponseSchema.optional(),
  accessToken: z.string().optional(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) { }

export const RegisterOAuthTenantSchema = z.object({
  onboardingToken: z.string().min(1, 'Token de onboarding obrigatório'),
  companyName: z.string().trim()
    .min(2, 'O nome da empresa deve ter no mínimo 2 caracteres').max(150, 'O nome da empresa deve ter no máximo 150 caracteres'),
  document: z.string().trim()
    .min(8, 'O documento deve ter no mínimo 8 caracteres')
    .max(20, 'O documento deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9.\-/]+$/, 'Documento com formato inválido'),
});

export class RegisterOAuthTenantDto extends createZodDto(
  RegisterOAuthTenantSchema,
) { }
