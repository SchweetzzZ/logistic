import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    PassportModule,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
