import { RequestContext } from './request-context.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { AppLoggerService, sanitizeSensitiveData } from './app-logger.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

describe('Observability Module', () => {
  describe('RequestContext', () => {
    it('should store and retrieve context within run()', () => {
      expect(RequestContext.getRequestId()).toBeUndefined();
      expect(RequestContext.getStore()).toBeUndefined();

      RequestContext.run(
        { requestId: 'req-123', tenantId: 'tenant-abc', userId: 'user-xyz' },
        () => {
          expect(RequestContext.getRequestId()).toBe('req-123');
          expect(RequestContext.getStore()).toEqual({
            requestId: 'req-123',
            tenantId: 'tenant-abc',
            userId: 'user-xyz',
          });

          RequestContext.setTenantId('tenant-new');
          RequestContext.setUserId('user-new');

          expect(RequestContext.getStore()?.tenantId).toBe('tenant-new');
          expect(RequestContext.getStore()?.userId).toBe('user-new');
        },
      );

      expect(RequestContext.getRequestId()).toBeUndefined();
    });
  });

  describe('CorrelationIdMiddleware', () => {
    let middleware: CorrelationIdMiddleware;

    beforeEach(() => {
      middleware = new CorrelationIdMiddleware();
    });

    it('should use incoming x-request-id header and set response header', (done) => {
      const req = {
        headers: { 'x-request-id': 'custom-id-999' },
      } as unknown as Request;

      const setHeaderMock = jest.fn();
      const res = {
        setHeader: setHeaderMock,
      } as unknown as Response;

      middleware.use(req, res, () => {
        expect(setHeaderMock).toHaveBeenCalledWith(
          'X-Request-ID',
          'custom-id-999',
        );
        expect(RequestContext.getRequestId()).toBe('custom-id-999');
        done();
      });
    });

    it('should use x-correlation-id if x-request-id is absent', (done) => {
      const req = {
        headers: { 'x-correlation-id': 'corr-id-888' },
      } as unknown as Request;

      const setHeaderMock = jest.fn();
      const res = {
        setHeader: setHeaderMock,
      } as unknown as Response;

      middleware.use(req, res, () => {
        expect(setHeaderMock).toHaveBeenCalledWith(
          'X-Request-ID',
          'corr-id-888',
        );
        expect(RequestContext.getRequestId()).toBe('corr-id-888');
        done();
      });
    });

    it('should generate UUID when no header is present', (done) => {
      const req = {
        headers: {},
      } as unknown as Request;

      let capturedHeaderVal = '';
      const res = {
        setHeader: jest.fn((key: string, val: string) => {
          if (key === 'X-Request-ID') {
            capturedHeaderVal = val;
          }
        }),
      } as unknown as Response;

      middleware.use(req, res, () => {
        expect(capturedHeaderVal).toBeDefined();
        expect(capturedHeaderVal.length).toBeGreaterThan(0);
        expect(RequestContext.getRequestId()).toBe(capturedHeaderVal);
        done();
      });
    });

    it('should extract tenantId and userId from req.user', (done) => {
      const req = {
        headers: {},
        user: { tenantId: 'tenant-42', userId: 'user-77' },
      } as unknown as Request;

      const res = {
        setHeader: jest.fn(),
      } as unknown as Response;

      middleware.use(req, res, () => {
        const store = RequestContext.getStore();
        expect(store?.tenantId).toBe('tenant-42');
        expect(store?.userId).toBe('user-77');
        done();
      });
    });
  });

  describe('AppLoggerService & Sensitive Data Sanitization', () => {
    it('should recursively sanitize sensitive fields and avoid circular reference crashes', () => {
      const payload: Record<string, unknown> = {
        password: 'plain_password',
        token: 'secret_jwt_token',
        secretKey: 'top_secret',
        authorization: 'Bearer token',
        creditCard: '1234-5678-9012-3456',
        passwordHash: 'hash$123',
        normalField: 'visible_data',
        nested: {
          refreshToken: 'refresh_xyz',
          safeData: 100,
        },
        list: [{ apiKey: 'key_abc' }, { harmless: true }],
      };

      // Add circular reference
      payload.self = payload;

      const sanitized = sanitizeSensitiveData(payload) as Record<
        string,
        unknown
      >;

      expect(sanitized.password).toBe('***');
      expect(sanitized.token).toBe('***');
      expect(sanitized.secretKey).toBe('***');
      expect(sanitized.authorization).toBe('***');
      expect(sanitized.creditCard).toBe('***');
      expect(sanitized.passwordHash).toBe('***');
      expect(sanitized.normalField).toBe('visible_data');

      const nested = sanitized.nested as Record<string, unknown>;
      expect(nested.refreshToken).toBe('***');
      expect(nested.safeData).toBe(100);

      const list = sanitized.list as Array<Record<string, unknown>>;
      expect(list[0].apiKey).toBe('***');
      expect(list[1].harmless).toBe(true);

      expect(sanitized.self).toBe('[Circular]');
    });

    it('should output structured single-line JSON with context and request information', () => {
      const logger = new AppLoggerService();
      const stdoutSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);
      const stderrSpy = jest
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);

      RequestContext.run(
        { requestId: 'req-log-test', tenantId: 'ten-1', userId: 'usr-1' },
        () => {
          logger.log('Informational message', 'CustomContext');

          expect(stdoutSpy).toHaveBeenCalledTimes(1);
          const stdoutArg = stdoutSpy.mock.calls[0][0] as string;
          const parsedLog = JSON.parse(stdoutArg.trim()) as Record<
            string,
            unknown
          >;

          expect(parsedLog.level).toBe('log');
          expect(parsedLog.message).toBe('Informational message');
          expect(parsedLog.context).toBe('CustomContext');
          expect(parsedLog.requestId).toBe('req-log-test');
          expect(parsedLog.tenantId).toBe('ten-1');
          expect(parsedLog.userId).toBe('usr-1');
          expect(parsedLog.timestamp).toBeDefined();

          const error = new Error('Database query failed');
          logger.error('Error occurred', error.stack, 'ErrorContext');

          expect(stderrSpy).toHaveBeenCalledTimes(1);
          const stderrArg = stderrSpy.mock.calls[0][0] as string;
          const parsedErr = JSON.parse(stderrArg.trim()) as Record<
            string,
            unknown
          >;

          expect(parsedErr.level).toBe('error');
          expect(parsedErr.message).toBe('Error occurred');
          expect(parsedErr.context).toBe('ErrorContext');
          expect(parsedErr.requestId).toBe('req-log-test');
          expect(parsedErr.stack).toContain('Database query failed');
        },
      );

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });
  });

  describe('AllExceptionsFilter', () => {
    it('should include requestId in exception response payload', () => {
      const filter = new AllExceptionsFilter();
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const host = {
        switchToHttp: () => ({
          getResponse: () => ({
            status: mockStatus,
          }),
        }),
      } as unknown as ArgumentsHost;

      RequestContext.run({ requestId: 'filter-test-uuid' }, () => {
        filter.catch(
          new HttpException('Forbidden resource', HttpStatus.FORBIDDEN),
          host,
        );

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: HttpStatus.FORBIDDEN,
            requestId: 'filter-test-uuid',
            message: 'Forbidden resource',
          }),
        );
      });
    });
  });
});
