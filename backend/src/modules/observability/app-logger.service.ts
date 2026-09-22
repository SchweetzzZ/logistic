import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from './request-context.service';

const SENSITIVE_REGEX = /password|token|secret|authorization|credit_?card|hash|api_?key/i;

export function sanitizeSensitiveData(data: unknown, visited = new WeakSet<object>()): unknown {
  if (data == null || typeof data !== 'object') return data;
  if (data instanceof Date || data instanceof RegExp) return data;
  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack };
  }
  if (visited.has(data)) return '[Circular]';
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSensitiveData(item, visited));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    cleanObj[key] = SENSITIVE_REGEX.test(key)
      ? '***'
      : sanitizeSensitiveData(value, visited);
  }
  return cleanObj;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  log(message: unknown, ...args: unknown[]) {
    this.emit('log', message, args);
  }

  error(message: unknown, ...args: unknown[]) {
    this.emit('error', message, args);
  }

  warn(message: unknown, ...args: unknown[]) {
    this.emit('warn', message, args);
  }

  debug(message: unknown, ...args: unknown[]) {
    this.emit('debug', message, args);
  }

  verbose(message: unknown, ...args: unknown[]) {
    this.emit('verbose', message, args);
  }

  fatal(message: unknown, ...args: unknown[]) {
    this.emit('fatal', message, args);
  }

  private emit(level: string, raw: unknown, params: unknown[]): void {
    const store = RequestContext.getStore();

    // Convenção do NestJS: se o último parâmetro for uma string sem quebra de linha, é o context
    let context: string | undefined;
    const lastParam = params[params.length - 1];
    if (
      params.length > 0 &&
      typeof lastParam === 'string' &&
      !lastParam.includes('\n')
    ) {
      context = params.pop() as string;
    }

    // Se for erro, captura stack trace se existir
    let stack: string | undefined;
    if ((level === 'error' || level === 'fatal') && params.length > 0) {
      const first = params[0];
      if (first instanceof Error) {
        stack = first.stack;
        params.shift();
      } else if (typeof first === 'string' && first.includes('\n')) {
        stack = first;
        params.shift();
      }
    }

    // Formatação segura da mensagem com type narrowing
    let message: string;
    if (raw instanceof Error) {
      message = raw.message;
      stack = stack || raw.stack;
    } else if (typeof raw === 'string') {
      message = raw;
    } else {
      message = JSON.stringify(sanitizeSensitiveData(raw));
    }

    // Monta o JSON canônico estruturado
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      requestId: store?.requestId,
      tenantId: store?.tenantId,
      userId: store?.userId,
      ...(stack ? { stack } : {}),
      ...(params.length > 0
        ? {
          extra: sanitizeSensitiveData(
            params.length === 1 ? params[0] : params,
          ),
        }
        : {}),
    };

    const output = JSON.stringify(entry) + '\n';
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  }
}
