import { registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ??
    '15m') as JwtSignOptions['expiresIn'],
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ??
    '7d') as JwtSignOptions['expiresIn'],
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_google_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/user/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'dummy_github_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_github_secret',
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ||
      'http://localhost:3001/user/auth/github/callback',
  },
}));
