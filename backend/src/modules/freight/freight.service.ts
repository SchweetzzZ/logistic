import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.constants';
import { carrierSchema, type Carrier } from '../carrier-management/schemas/schema';
import { auditFreightSchema } from './schemas/schema';
import { SimulateFreightDto } from './dto/freight.dto';
import type { LocationInfo, FreightQuote, SimulationResult } from './dto/freight.types';

// Tabela de faixas de CEP → UF (Correios). Usado apenas como fallback caso a BrasilAPI falhe.
const CEP_RANGES: [number, number, string][] = [
  [1, 19, 'SP'], [20, 28, 'RJ'], [29, 29, 'ES'], [30, 39, 'MG'],
  [40, 48, 'BA'], [49, 49, 'SE'], [50, 56, 'PE'], [57, 57, 'AL'],
  [58, 58, 'PB'], [59, 59, 'RN'], [60, 63, 'CE'], [64, 64, 'PI'],
  [65, 65, 'MA'], [66, 68, 'PA'], [69, 69, 'AM'], [70, 72, 'DF'],
  [73, 76, 'GO'], [77, 77, 'TO'], [78, 78, 'MT'], [79, 79, 'MS'],
  [80, 87, 'PR'], [88, 89, 'SC'], [90, 99, 'RS'],
];

@Injectable()
export class FreightService {
  private readonly logger = new Logger(FreightService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  /**
   * Consulta localização via BrasilAPI com timeout de 3.5s e fallback por prefixo de CEP.
   */
  async getZipCodeInfo(zipCode: string): Promise<LocationInfo> {
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v1/${zipCode}`,
        { signal: AbortSignal.timeout(3500) }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          zipCode,
          city: data.city || 'Cidade Desconhecida',
          state: (data.state || 'SP').toUpperCase(),
        };
      }
    } catch {
      // Fallback silencioso: timeout, offline ou erro da API externa
    }

    const prefix = parseInt(zipCode.substring(0, 2), 10);
    const state = CEP_RANGES.find(([min, max]) => prefix >= min && prefix <= max)?.[2] ?? 'SP';

    return { zipCode, city: 'Localidade Estimada', state, isEstimated: true };
  }

  /**
   * Executa a simulação completa de frete
   */
  async simulateFreight(
    tenantId: string,
    dto: SimulateFreightDto,
    userId?: string,
  ): Promise<SimulationResult> {
    // 1. Consulta de Origem e Destino em paralelo via BrasilAPI
    const [origin, destination] = await Promise.all([
      this.getZipCodeInfo(dto.originZipCode || '01001000'),
      this.getZipCodeInfo(dto.destinationZipCode),
    ]);

    // 2. Cubagem: Peso Cobrado = max(peso real, volume/6000)
    const { length, width, height } = dto.dimensions;
    const volumetricWeightKg = Math.round((length * width * height / 6000) * 1000) / 1000;
    const chargedWeightKg = Math.max(dto.weight, volumetricWeightKg);

    // 3. Fator de Distância
    let deliveryType: 'LOCAL' | 'STATE' | 'INTERSTATE' = 'INTERSTATE';
    let distanceMultiplier = 1.5;
    let extraDays = 3;

    if (origin.state === destination.state) {
      if (origin.city.trim().toLowerCase() === destination.city.trim().toLowerCase()) {
        deliveryType = 'LOCAL';
        distanceMultiplier = 1.0;
        extraDays = 0;
      } else {
        deliveryType = 'STATE';
        distanceMultiplier = 1.25;
        extraDays = 1;
      }
    }

    // 4. Seguro / Ad-Valorem (0.5% do valor declarado)
    const insuranceCost = Math.round(dto.declaredValue * 0.005 * 100) / 100;

    // 5. Buscar Transportadoras Ativas do Tenant
    const whereConditions = [
      eq(carrierSchema.tenantId, tenantId),
      eq(carrierSchema.status, 'ACTIVE'),
    ];
    if (dto.carrierId) whereConditions.push(eq(carrierSchema.id, dto.carrierId));

    const carriers: Carrier[] = await this.db
      .select()
      .from(carrierSchema)
      .where(and(...whereConditions));

    if (dto.carrierId && carriers.length === 0) {
      throw new NotFoundException('Transportadora informada não foi encontrada ou está inativa nesta empresa');
    }
    if (carriers.length === 0) {
      throw new NotFoundException('Nenhuma transportadora ativa encontrada para realizar a cotação nesta empresa');
    }

    // 6. Cotação por transportadora, ordenada por menor preço
    const quotes: FreightQuote[] = carriers
      .map((carrier) => {
        const basePrice = Number(carrier.basePrice);
        const pricePerKg = Number(carrier.pricePerKg);
        const weightCost = Math.round(chargedWeightKg * pricePerKg * 100) / 100;
        const shippingSubtotal = Math.round((basePrice + weightCost) * distanceMultiplier * 100) / 100;
        const totalPrice = Math.round((shippingSubtotal + insuranceCost) * 100) / 100;

        return {
          carrierId: carrier.id,
          carrierName: carrier.name,
          deadlineDays: carrier.deadlineDays + extraDays,
          breakdown: { basePrice, pricePerKg, chargedWeightKg, weightCost, distanceMultiplier, shippingSubtotal, insuranceCost },
          totalPrice,
        };
      })
      .sort((a, b) => a.totalPrice - b.totalPrice);

    const result: SimulationResult = {
      origin,
      destination,
      package: { actualWeightKg: dto.weight, volumetricWeightKg, chargedWeightKg, declaredValue: dto.declaredValue, dimensions: dto.dimensions },
      deliveryType,
      quotes,
    };

    // 7. Gravação de Auditoria do Histórico de Frete (Fail-safe)
    try {
      const cheapest = quotes[0];
      await this.db.insert(auditFreightSchema).values({
        tenantId,
        userId: userId ?? null,
        originZipCode: origin.zipCode,
        destinationZipCode: destination.zipCode,
        originCity: origin.city,
        originState: origin.state,
        destinationCity: destination.city,
        destinationState: destination.state,
        actualWeightKg: dto.weight.toString(),
        volumetricWeightKg: volumetricWeightKg.toString(),
        chargedWeightKg: chargedWeightKg.toString(),
        declaredValue: dto.declaredValue.toString(),
        dimensionsLength: length.toString(),
        dimensionsWidth: width.toString(),
        dimensionsHeight: height.toString(),
        deliveryType,
        cheapestCarrierId: cheapest?.carrierId ?? null,
        cheapestCarrierName: cheapest?.carrierName ?? null,
        cheapestPrice: cheapest ? cheapest.totalPrice.toString() : null,
        cheapestDeadlineDays: cheapest?.deadlineDays ?? null,
        quotes,
      });
    } catch (auditError: any) {
      this.logger.error(
        `Falha ao gravar histórico em audit_freight: ${auditError?.message || auditError}`,
      );
    }

    return result;
  }

  /**
   * Consulta paginada do histórico de simulações realizadas no tenant
   */
  async getHistory(tenantId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditFreightSchema)
      .where(eq(auditFreightSchema.tenantId, tenantId));

    const total = Number(totalResult?.count || 0);

    const data = await this.db
      .select()
      .from(auditFreightSchema)
      .where(eq(auditFreightSchema.tenantId, tenantId))
      .orderBy(desc(auditFreightSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
