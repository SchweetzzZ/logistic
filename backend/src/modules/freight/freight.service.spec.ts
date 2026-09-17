import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FreightService } from './freight.service';
import { DRIZZLE } from '../database/database.constants';
import { auditFreightSchema } from './schemas/schema';

describe('FreightService', () => {
  let service: FreightService;
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
        FreightService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<FreightService>(FreightService);
  });

  it('deve priorizar o peso cubado quando este for maior que o peso real e gravar auditoria', async () => {
    // 50x50x50 cm = 125.000 cm³ -> 125.000 / 6000 = ~20.833 kg cubado
    // Peso real: 5 kg -> Deve cobrar 20.833 kg
    const mockCarriers = [
      { id: '1', name: 'Express Log', basePrice: '10.00', pricePerKg: '2.00', deadlineDays: 2, status: 'ACTIVE', tenantId: 'tenant-1' },
    ];

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockCarriers),
      }),
    });

    jest.spyOn(service, 'getZipCodeInfo').mockImplementation(async (zip) => ({
      zipCode: zip,
      city: 'São Paulo',
      state: 'SP',
    }));

    const result = await service.simulateFreight('tenant-1', {
      destinationZipCode: '01001000',
      originZipCode: '01001000',
      weight: 5,
      dimensions: { length: 50, width: 50, height: 50 },
      declaredValue: 1000,
    }, 'user-123');

    expect(result.package.chargedWeightKg).toBeCloseTo(20.833, 2);
    expect(result.deliveryType).toBe('LOCAL');
    expect(result.quotes[0].breakdown.insuranceCost).toBe(5); // 1000 * 0.005

    // Verifica se gravou na tabela audit_freight
    expect(mockDb.insert).toHaveBeenCalledWith(auditFreightSchema);
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      userId: 'user-123',
      deliveryType: 'LOCAL',
      cheapestCarrierName: 'Express Log',
    }));
  });

  it('deve calcular frete interestadual com multiplicador 1.5x e dias extras', async () => {
    const mockCarriers = [
      { id: '1', name: 'Interstate Cargo', basePrice: '20.00', pricePerKg: '5.00', deadlineDays: 3, status: 'ACTIVE', tenantId: 'tenant-1' },
    ];

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockCarriers),
      }),
    });

    jest.spyOn(service, 'getZipCodeInfo').mockImplementation(async (zip) => {
      if (zip === '01001000') {
        return { zipCode: zip, city: 'São Paulo', state: 'SP' };
      }
      return { zipCode: zip, city: 'Rio de Janeiro', state: 'RJ' };
    });

    const result = await service.simulateFreight('tenant-1', {
      destinationZipCode: '20040000',
      originZipCode: '01001000',
      weight: 10,
      dimensions: { length: 10, width: 10, height: 10 },
      declaredValue: 500,
    });

    expect(result.deliveryType).toBe('INTERSTATE');
    expect(result.quotes[0].deadlineDays).toBe(6); // 3 + 3
    expect(result.quotes[0].totalPrice).toBe(107.5);
    expect(mockDb.insert).toHaveBeenCalledWith(auditFreightSchema);
  });

  it('deve lançar NotFoundException quando nenhuma transportadora ativa for encontrada', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    jest.spyOn(service, 'getZipCodeInfo').mockImplementation(async (zip) => ({
      zipCode: zip,
      city: 'São Paulo',
      state: 'SP',
    }));

    await expect(
      service.simulateFreight('tenant-1', {
        destinationZipCode: '01001000',
        weight: 1,
        dimensions: { length: 10, width: 10, height: 10 },
        declaredValue: 100,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve consultar o histórico de simulações com paginação', async () => {
    const mockHistoryData = [{ id: 'audit-1', originZipCode: '01001000' }];
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockHistoryData),
              }),
            }),
          }),
        }),
      });

    const result = await service.getHistory('tenant-1', 1, 10);
    expect(result.total).toBe(1);
    expect(result.data).toEqual(mockHistoryData);
    expect(result.totalPages).toBe(1);
  });
});
