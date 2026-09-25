import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { RequestContext } from '../../observability/request-context.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Erro interno do servidor';

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      const zodError = exception.getZodError();
      message =
        typeof zodError === 'object' &&
          zodError !== null &&
          'format' in zodError &&
          typeof (zodError as { format: () => unknown }).format === 'function'
          ? (zodError as { format: () => unknown }).format()
          : zodError;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'object' && res !== null ? res : { message: res };
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      ('code' in exception || 'errno' in exception)
    ) {
      const err = exception as {
        code?: string | number;
        errno?: number;
        message?: string;
      };

      // MySQL duplicate key error (ER_DUP_ENTRY / 1062)
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        status = HttpStatus.CONFLICT;
        message = {
          message:
            'Conflito: já existe um registro cadastrado com as informações fornecidas.',
          error: 'Conflict',
        };
      } else {
        this.logger.error('Unhandled Database / SQL Exception', exception);
      }
    } else {
      this.logger.error('Unhandled Unknown Exception', exception);
    }

    const payload =
      typeof message === 'object' && message !== null
        ? (message as Record<string, unknown>)
        : { message: String(message) };

    const requestId = RequestContext.getRequestId();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId,
      ...payload,
    });
  }
}
