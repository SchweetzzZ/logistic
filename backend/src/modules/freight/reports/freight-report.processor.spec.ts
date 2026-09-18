import { Test, TestingModule } from '@nestjs/testing';
import { FreightReportProcessor } from './freight-report.processor';
import { DRIZZLE, type DrizzleDB } from '../../database/database.constants';
import { SseNotificationService } from '../../notification/sse-notification.service';
import * as fs from 'fs';
import * as path from 'path';

describe('FreightReportProcessor', () => {
  let processor: FreightReportProcessor;
  let mockDb: Record<string, unknown>;
  let mockSseService: { sendToUser: jest.Mock };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([
        {
          id: 'sim-1',
          tenantId: 'tenant-1',
          createdAt: '2026-09-17 12:00:00',
          originZipCode: '01001000',
          originCity: 'São Paulo',
          originState: 'SP',
          destinationZipCode: '20040002',
          destinationCity: 'Rio de Janeiro',
          destinationState: 'RJ',
          actualWeightKg: '5.000',
          volumetricWeightKg: '4.000',
          chargedWeightKg: '5.000',
          declaredValue: '150.00',
          deliveryType: 'STATE',
          cheapestCarrierName: 'LogExpress',
          cheapestPrice: '45.00',
          cheapestDeadlineDays: 3,
        },
      ]),
    };

    mockSseService = {
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightReportProcessor,
        { provide: DRIZZLE, useValue: mockDb as DrizzleDB },
        { provide: SseNotificationService, useValue: mockSseService },
      ],
    }).compile();

    processor = module.get<FreightReportProcessor>(FreightReportProcessor);
  });

  afterAll(() => {
    // Limpeza de arquivos de teste gerados em storage/reports/
    const testFile = path.resolve(
      process.cwd(),
      'storage',
      'reports',
      'relatorio-fretes-job-test-123.csv',
    );
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('deve processar registros, gravar arquivo CSV e notificar via SSE', async () => {
    const mockJob = {
      id: 'job-test-123',
      data: {
        tenantId: 'tenant-1',
        userId: 'user-1',
      },
    } as unknown as Parameters<FreightReportProcessor['process']>[0];

    const result = await processor.process(mockJob);

    expect(result.totalRecords).toBe(1);
    expect(fs.existsSync(result.filePath)).toBe(true);

    const fileContent = fs.readFileSync(result.filePath, 'utf-8');
    expect(fileContent).toContain('LogExpress');
    expect(fileContent).toContain('São Paulo');

    expect(mockSseService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'REPORT_READY',
      expect.objectContaining({
        jobId: 'job-test-123',
        totalRecords: 1,
      }),
    );
  });
});
