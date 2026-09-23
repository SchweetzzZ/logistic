import { Controller, Post, Get, Body, Req, Res, UseGuards, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterTenantDto, LoginDto, RefreshTokenDto, AuthResponseDto, MessageResponseDto, RegisterOAuthTenantDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { authConfig } from '../../config/auth.config';
import type { OAuthUserPayload } from '../common/strategies/google.strategy';

interface OAuthRequest extends Request {
  user: OAuthUserPayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,
  ) { }

  private getClientInfo(req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers['user-agent'];
    return { ipAddress, userAgent };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string,) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
  }

  private clearAuthCookies(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      secure: isProduction,
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      secure: isProduction,
    });
  }

  private async handleOAuthCallback(req: OAuthRequest, res: Response, provider: string,) {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    const frontendUrl = this.authConfiguration.frontendUrl;

    const result = await this.authService.handleOAuthLogin(
      req.user,
      ipAddress,
      userAgent,
    );

    if (result.isNewUser && result.profile) {
      return res.redirect(
        `${frontendUrl}/register?oauth=${provider}&token=${result.onboardingToken}&name=${encodeURIComponent(result.profile.name)}&email=${encodeURIComponent(result.profile.email)}`,
      );
    }

    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
      return res.redirect(
        `${frontendUrl}/login/oauth-callback?token=${result.accessToken}`,
      );
    }

    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Auto-cadastro: cria a Empresa (Tenant) e o usuário ADMIN',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'Empresa e Administrador cadastrados com sucesso',
  })
  async register(@Body() dto: RegisterTenantDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Autenticar com email e senha (emite cookies HttpOnly e Bearer)',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Login bem-sucedido com cookies emitidos',
  })
  async login(@Req() req: Request, @Body() dto: LoginDto, @Res({ passthrough: true }) res: Response,): Promise<AuthResponseDto> {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    const result = await this.authService.login(dto, ipAddress, userAgent);

    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redireciona para autenticação com Google' })
  async googleAuth() {
    // Redirecionamento automático pelo Passport Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback da autenticação com Google' })
  async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback(req, res, 'google');
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Redireciona para autenticação com GitHub' })
  async githubAuth() {
    // Redirecionamento automático pelo Passport GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Callback da autenticação com GitHub' })
  async githubCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.handleOAuthCallback(req, res, 'github');
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-oauth')
  @ApiOperation({
    summary:
      'Conclui o cadastro da empresa após login social (Google ou GitHub)',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'Empresa e Administrador criados via OAuth com sucesso',
  })
  async registerOAuth(@Req() req: Request, @Body() dto: RegisterOAuthTenantDto, @Res({ passthrough: true }) res: Response,): Promise<AuthResponseDto> {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    const result = await this.authService.registerOAuthTenant(dto, ipAddress, userAgent,);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Renovar Access Token via Refresh Token (cookie ou body)',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Sessão renovada com sucesso',
  })
  async refreshToken(@Req() req: Request, @Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response,): Promise<AuthResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token: string | undefined = cookies?.['refresh_token'] || dto.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const result = await this.authService.refreshToken(token);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'Encerrar sessão, revogar refresh token e limpar cookies',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Logout efetuado com sucesso',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<MessageResponseDto> {
    const { ipAddress, userAgent } = this.getClientInfo(req);
    this.clearAuthCookies(res);

    let userId: string | undefined;
    let tenantId: string | undefined;

    const cookies = req.cookies as Record<string, string> | undefined;
    const authHeader = req.headers.authorization;
    const accessToken =
      cookies?.['jwt'] ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

    if (accessToken) {
      try {
        const payload = this.jwtService.verify<{
          sub: string;
          tenantId?: string;
        }>(accessToken, {
          secret: this.authConfiguration.jwtSecret,
        });
        userId = payload.sub;
        tenantId = payload.tenantId;
      } catch {
        // Access token pode estar expirado ou inválido, tenta obter via refresh_token
      }
    }

    if (!userId) {
      const refreshToken = cookies?.['refresh_token'];
      if (refreshToken) {
        try {
          const payload = this.jwtService.verify<{
            sub: string;
            tenantId?: string;
          }>(refreshToken, {
            secret: this.authConfiguration.refreshTokenSecret,
          });
          userId = payload.sub;
          tenantId = payload.tenantId;
        } catch {
          // Refresh token expirado ou inválido
        }
      }
    }

    if (userId) {
      try {
        await this.authService.logout(userId, tenantId, ipAddress, userAgent);
      } catch {
        // Ignora falha de banco no encerramento de sessão
      }
    }

    return { message: 'Logout efetuado com sucesso' };
  }
}
