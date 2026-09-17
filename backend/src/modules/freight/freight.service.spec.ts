import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FreightService } from './freight.service';
import { DRIZZLE } from '../database/database.constants';

describe('FreightService', () => {
  let service: FreightService;
  const mockDb = {
    select: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<FreightService>(FreightService);
  });

  it('deve priorizar o peso cubado quando este for maior que o peso real', async () => {
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
    });

    expect(result.package.chargedWeightKg).toBeCloseTo(20.833, 2);
    expect(result.deliveryType).toBe('LOCAL');
    expect(result.quotes[0].breakdown.insuranceCost).toBe(5); // 1000 * 0.005
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
    // weightCost = 10 * 5 = 50
    // subtotal = (20 + 50) * 1.5 = 105
    // insurance = 500 * 0.005 = 2.5
    // total = 107.5
    expect(result.quotes[0].totalPrice).toBe(107.5);
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
});
