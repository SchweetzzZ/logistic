import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type ConfigType } from '@nestjs/config';
import type { Request } from 'express';

import { authConfig } from '../../../config/auth.config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY)
    authConfiguration: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          const cookies = request?.cookies as
            Record<string, string> | undefined;
          return cookies?.['jwt'] ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: authConfiguration.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    await Promise.resolve();
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token payload inválido ou corrompido');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
