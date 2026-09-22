import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { type ConfigType } from '@nestjs/config';
import { authConfig } from '../../../config/auth.config';
import type { OAuthUserPayload } from './google.strategy';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    @Inject(authConfig.KEY)
    authConfiguration: ConfigType<typeof authConfig>,
  ) {
    super({
      clientID: authConfiguration.github.clientId,
      clientSecret: authConfiguration.github.clientSecret,
      callbackURL: authConfiguration.github.callbackUrl,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const email =
      profile.emails?.[0]?.value ||
      `${profile.username}@users.noreply.github.com`;
    const name = profile.displayName || profile.username || 'Usuário GitHub';
    const avatarUrl = profile.photos?.[0]?.value;

    const user: OAuthUserPayload = {
      email,
      name,
      provider: 'GITHUB',
      providerId: profile.id,
      avatarUrl,
    };

    done(null, user);
  }
}
