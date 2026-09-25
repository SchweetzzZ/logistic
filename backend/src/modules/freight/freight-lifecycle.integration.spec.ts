import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { carrierController } from '../carrier-management/carrier.controller';
import { carrierService } from '../carrier-management/carrier.service';
import { FreightController } from './freight.controller';
import { FreightService } from './freight.service';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.constants';
import { carrierSchema } from '../carrier-management/schemas/schema';
import { auditFreightSchema } from './schemas/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

describe('Ciclo de Vida da Cotação de Frete (Integração: Transportadora -> Simulação -> Histórico)', () => {
  let app: INestApplication;

  // Bancos de dados em memória para simular o ciclo de persistência completo
  const inMemoryCarriers: any[] = [];
  const inMemoryAuditFreight: any[] = [];
  const inMemoryAuditLogs: any[] = [];

  // Contexto de Tenant e Usuário mutável para testar isolamento
  let currentAuthContext = {
    userId: 'user-operator-1',
    email: 'operador@empresa-alpha.com',
    role: 'ADMIN',
    tenantId: 'tenant-alpha',
  };

  beforeAll(async () => {
    // Mock reativo e stateful do Drizzle ORM
    const mockDb = {
      insert: jest.fn().mockImplementation((table: any) => ({
        values: jest.fn().mockImplementation(async (values: any) => {
          if (table === carrierSchema) {
            const newCarrier = {
              id: randomUUID(),
              status: values.status ?? 'ACTIVE',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...values,
              basePrice: values.basePrice?.toString() ?? '0.00',
              pricePerKg: values.pricePerKg?.toString() ?? '0.00',
            };
            inMemoryCarriers.push(newCarrier);
            return [{ insertId: inMemoryCarriers.length }];
          }

          if (table === auditFreightSchema) {
            const newAudit = {
              id: randomUUID(),
              createdAt: new Date().toISOString(),
              ...values,
            };
            inMemoryAuditFreight.push(newAudit);
            return [{ insertId: inMemoryAuditFreight.length }];
          }

          inMemoryAuditLogs.push(values);
          return [{ insertId: inMemoryAuditLogs.length }];
        }),
      })),

      select: jest.fn().mockImplementation((selectFields?: any) => ({
        from: jest.fn().mockImplementation((table: any) => ({
          where: jest.fn().mockImplementation((condition?: any) => {
            if (table === carrierSchema) {
              const filtered = inMemoryCarriers.filter(
                (c) => c.tenantId === currentAuthContext.tenantId,
              );
              return Object.assign(Promise.resolve(filtered), {
                limit: jest.fn().mockImplementation((limitCount: number) => {
                  return Promise.resolve(filtered.slice(0, limitCount));
                }),
              });
            }

            if (table === auditFreightSchema) {
              const filtered = inMemoryAuditFreight.filter(
                (a) => a.tenantId === currentAuthContext.tenantId,
              );

              // Consulta de agregação: count(*)
              if (selectFields && typeof selectFields === 'object' && 'count' in selectFields) {
                return Promise.resolve([{ count: filtered.length }]);
              }

              return {
                orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockImplementation((limit: number) => ({
                    offset: jest.fn().mockImplementation((offset: number) => {
                      const sliced = filtered.slice(offset, offset + limit);
                      return Promise.resolve(sliced);
                    }),
                  })),
                }),
              };
            }

            return Promise.resolve([]);
          }),
        })),
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [carrierController, FreightController],
      providers: [
        carrierService,
        FreightService,
        AuditService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = currentAuthContext;
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());

    // Mock do serviço de localização externa do FreightService para manter o teste determinístico e veloz
    const freightService = app.get<FreightService>(FreightService);
    jest.spyOn(freightService, 'getZipCodeInfo').mockImplementation(async (zip: string) => {
      if (zip.startsWith('01')) {
        return { zipCode: zip, city: 'São Paulo', state: 'SP' };
      }
      return { zipCode: zip, city: 'Rio de Janeiro', state: 'RJ' };
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset para o tenant principal antes de cada cenário
    currentAuthContext = {
      userId: 'user-operator-1',
      email: 'operador@empresa-alpha.com',
      role: 'ADMIN',
      tenantId: 'tenant-alpha',
    };
  });

  it('deve executar o ciclo de vida completo: Cadastrar Transportadora -> Simular Frete -> Persistir e Consultar Histórico', async () => {
    // -----------------------------------------------------------------------------------------
    // PASSO 1: Início do Ciclo - Cadastra uma nova transportadora via HTTP POST /carriers
    // -----------------------------------------------------------------------------------------
    const newCarrierPayload = {
      name: 'TransLog Rápido',
      document: '11222333000199',
      email: 'contato@translog.com',
      phone: '11988887777',
      basePrice: 20.0,
      pricePerKg: 3.5,
      deadlineDays: 2,
      status: 'ACTIVE',
    };

    const carrierRes = await request(app.getHttpServer())
      .post('/carriers')
      .send(newCarrierPayload)
      .expect(201);

    expect(carrierRes.body).toBeDefined();
    expect(carrierRes.body.name).toBe('TransLog Rápido');
    expect(carrierRes.body.status).toBe('ACTIVE');
    expect(carrierRes.body.tenantId).toBe('tenant-alpha');

    // -----------------------------------------------------------------------------------------
    // PASSO 2: Operação Principal - Realiza uma cotação de frete via HTTP POST /freight/simulate
    // A engine de frete deve localizar a transportadora criada no Passo 1 e aplicar os cálculos
    // -----------------------------------------------------------------------------------------
    const simulationPayload = {
      originZipCode: '01001000',      // SP (Origem)
      destinationZipCode: '20040002', // RJ (Destino: Interestadual => 1.5x no frete e +3 dias)
      weight: 4.0,                    // 4 kg real
      dimensions: {
        length: 40,
        width: 30,
        height: 20,                   // (40*30*20)/6000 = 4.0 kg cubado
      },
      declaredValue: 1000,            // Seguro de 0.5% = R$ 5,00
    };

    const simulateRes = await request(app.getHttpServer())
      .post('/freight/simulate')
      .send(simulationPayload)
      .expect(201);

    const simulation = simulateRes.body;
    expect(simulation).toBeDefined();
    expect(simulation.deliveryType).toBe('INTERSTATE');
    expect(simulation.quotes).toHaveLength(1);

    const quote = simulation.quotes[0];
    expect(quote.carrierName).toBe('TransLog Rápido');
    // Preço base (20) + peso (4 * 3.5 = 14) = 34 * 1.5 (interestadual) = 51 + 5 (seguro) = 56
    expect(quote.totalPrice).toBe(56);
    expect(quote.deadlineDays).toBe(5); // 2 dias da transportadora + 3 dias interestadual

    // -----------------------------------------------------------------------------------------
    // PASSO 3: Fim do Ciclo - Consultar o histórico via HTTP GET /freight/history
    // Valida que o evento foi registrado na auditoria e está disponível para consulta
    // -----------------------------------------------------------------------------------------
    const historyRes = await request(app.getHttpServer())
      .get('/freight/history?page=1&limit=10')
      .expect(200);

    expect(historyRes.body.total).toBe(1);
    expect(historyRes.body.data).toHaveLength(1);

    const historyRecord = historyRes.body.data[0];
    expect(historyRecord.tenantId).toBe('tenant-alpha');
    expect(historyRecord.cheapestCarrierName).toBe('TransLog Rápido');
    expect(historyRecord.cheapestPrice).toBe('56');
    expect(historyRecord.deliveryType).toBe('INTERSTATE');
    expect(historyRecord.originCity).toBe('São Paulo');
    expect(historyRecord.destinationCity).toBe('Rio de Janeiro');
  });

  it('deve garantir o isolamento multi-tenant durante todo o ciclo de vida', async () => {
    // Altera o contexto para um tenant secundário (tenant-beta)
    currentAuthContext = {
      userId: 'user-beta-99',
      email: 'financeiro@empresa-beta.com',
      role: 'ADMIN',
      tenantId: 'tenant-beta',
    };

    // 1. O tenant-beta não deve enxergar as transportadoras nem conseguir cotar sem transportadora cadastrada
    const betaSimulationPayload = {
      originZipCode: '01001000',
      destinationZipCode: '01001000',
      weight: 2.0,
      dimensions: { length: 10, width: 10, height: 10 },
      declaredValue: 200,
    };

    const errorRes = await request(app.getHttpServer())
      .post('/freight/simulate')
      .send(betaSimulationPayload)
      .expect(404);

    expect(errorRes.body.message).toContain('Nenhuma transportadora ativa encontrada');

    // 2. O tenant-beta também não deve ter acesso ao histórico do tenant-alpha
    const betaHistoryRes = await request(app.getHttpServer())
      .get('/freight/history?page=1&limit=10')
      .expect(200);

    expect(betaHistoryRes.body.total).toBe(0);
    expect(betaHistoryRes.body.data).toHaveLength(0);
  });
});
