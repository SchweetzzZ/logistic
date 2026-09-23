import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { type ConfigType } from '@nestjs/config';
import { authConfig } from '../../../config/auth.config';

export interface OAuthUserPayload {
  email: string;
  name: string;
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(authConfig.KEY)
    authConfiguration: ConfigType<typeof authConfig>,
  ) {
    super({
      clientID: authConfiguration.google.clientId || '',
      clientSecret: authConfiguration.google.clientSecret || '',
      callbackURL: authConfiguration.google.callbackUrl || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value || '';
    const name =
      profile.displayName ||
      `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
      'Usuário Google';
    const avatarUrl = profile.photos?.[0]?.value;

    const user: OAuthUserPayload = {
      email,
      name,
      provider: 'GOOGLE',
      providerId: profile.id,
      avatarUrl,
    };

    done(null, user);
  }
}
