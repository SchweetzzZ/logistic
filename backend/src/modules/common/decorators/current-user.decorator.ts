import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

export const CurrentUser = createParamDecorator((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | string | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
  const user = request.user;
  if (!user) {
    return undefined;
  }
  return data ? user[data] : user;
},
);
