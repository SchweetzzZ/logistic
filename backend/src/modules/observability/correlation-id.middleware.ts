import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContext } from './request-context.service';

function getHeader(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

interface RequestWithUser extends Request {
  user?: { tenantId?: string; userId?: string; id?: string };
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      getHeader(req.headers['x-request-id']) ||
      getHeader(req.headers['x-correlation-id']) ||
      randomUUID();

    res.setHeader('X-Request-ID', requestId);

    const user = (req as RequestWithUser).user;
    const tenantId = user?.tenantId || getHeader(req.headers['x-tenant-id']);
    const userId =
      user?.userId || user?.id || getHeader(req.headers['x-user-id']);

    RequestContext.run({ requestId, tenantId, userId }, () => {
      next();
    });
  }
}
