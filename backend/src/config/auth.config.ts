import { registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'],
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d') as JwtSignOptions['expiresIn'],
}));