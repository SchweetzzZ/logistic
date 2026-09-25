import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { type PermissionKey, checkRolePermission } from '../access-control/permissions';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PermissionKey[]>(
        REQUIRE_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado: usuário não autenticado');
    }

    for (const required of requiredPermissions) {
      const hasPermission = checkRolePermission(user.role, required);
      if (!hasPermission) {
        throw new ForbiddenException(
          `Acesso negado: permissão '${required}' necessária para acessar este recurso`,
        );
      }
    }

    return true;
  }
}
