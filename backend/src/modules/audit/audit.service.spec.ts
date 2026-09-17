import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { DRIZZLE } from '../database/database.constants';
import { auditLogsSchema } from './schemas/schema';

describe('AuditService', () => {
  let service: AuditService;
  const mockInsertValues = jest.fn().mockResolvedValue({});
  const mockDb = {
    select: jest.fn(),
    insert: jest.fn().mockReturnValue({
      values: mockInsertValues,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.insert.mockReturnValue({
      values: mockInsertValues,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('deve registrar um log de auditoria com sucesso', async () => {
    await service.log({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'AUTH_LOGIN',
      resource: 'auth',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      details: { email: 'admin@empresa.com' },
    });

    expect(mockDb.insert).toHaveBeenCalledWith(auditLogsSchema);
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'AUTH_LOGIN',
      resource: 'auth',
    }));
  });

  it('não deve lançar exceção se a inserção de auditoria falhar (resiliência fail-safe)', async () => {
    mockInsertValues.mockRejectedValueOnce(new Error('DB Connection Timeout'));

    await expect(
      service.log({
        tenantId: 'tenant-1',
        action: 'CARRIER_CREATE',
        resource: 'carrier',
      }),
    ).resolves.not.toThrow();
  });

  it('deve listar logs de auditoria com paginação', async () => {
    const mockLogs = [{ id: 'log-1', action: 'AUTH_LOGIN' }];

    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockLogs),
                }),
              }),
            }),
          }),
        }),
      });

    const result = await service.findAll('tenant-1', { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data).toEqual(mockLogs);
    expect(result.totalPages).toBe(1);
  });
});
