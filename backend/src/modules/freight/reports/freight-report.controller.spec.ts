import { Test, TestingModule } from '@nestjs/testing';
import { FreightReportController } from './freight-report.controller';
import { getQueueToken } from '@nestjs/bullmq';

describe('FreightReportController', () => {
  let controller: FreightReportController;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FreightReportController],
      providers: [
        {
          provide: getQueueToken('freight-reports'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    controller = module.get<FreightReportController>(FreightReportController);
  });

  it('deve enfileirar um relatório e responder status PROCESSING com jobId', async () => {
    const result = await controller.exportReport('tenant-1', 'user-1', {
      format: 'csv',
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'generate-report',
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        format: 'csv',
      }),
      expect.any(Object),
    );

    expect(result.jobId).toBe('job-123');
    expect(result.status).toBe('PROCESSING');
    expect(typeof result.message).toBe('string');
  });
});
