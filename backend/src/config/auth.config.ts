import { registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as JwtSignOptions['expiresIn'],
  frontendUrl: process.env.FRONTEND_URL!,

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
  },

  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackUrl: process.env.GITHUB_CALLBACK_URL!,
  },
}));
