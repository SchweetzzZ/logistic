import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { CreateCarrierDto, UpdateCarrierDto } from './dto/carrier-dto';
import { and, eq, desc } from 'drizzle-orm';
import { carrierSchema, type Carrier } from './schemas/schema';
import { AuditService } from '../audit/audit.service';
import { insertInBatches } from '../common/csv/csv-parser.util';
import type { CsvImportResult } from '../common/csv/csv-import.types';
import { parseCarriersCsv } from './carrier-csv.importer';

@Injectable()
export class carrierService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService) { }

  async create(tenantId: string, data: CreateCarrierDto, userId?: string): Promise<Carrier> {
    try {
      await this.db.insert(carrierSchema).values({
        ...data,
        basePrice: data.basePrice.toString(),
        pricePerKg: data.pricePerKg.toString(),
        tenantId,
      });

      const [created] = await this.db
        .select()
        .from(carrierSchema)
        .where(
          and(
            eq(carrierSchema.tenantId, tenantId),
            eq(carrierSchema.document, data.document),
          ),
        )
        .limit(1);

      await this.auditService.log({
        tenantId,
        userId: userId ?? null,
        action: 'CARRIER_CREATE',
        resource: 'carrier',
        resourceId: created.id,
        details: {
          name: created.name,
          document: created.document,
          basePrice: created.basePrice,
          pricePerKg: created.pricePerKg,
          deadlineDays: created.deadlineDays,
        },
      });

      return created;
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictException(
          'Já existe uma transportadora cadastrada com este nome ou documento nesta empresa',
        );
      }
      throw error;
    }
  }

  async update(tenantId: string, id: string, data: UpdateCarrierDto, userId?: string): Promise<Carrier> {
    const current = await this.findById(tenantId, id);

    const diff: Record<string, { from: any; to: any }> = {};
    if (data.name !== undefined && data.name !== current.name) {
      diff.name = { from: current.name, to: data.name };
    }
    if (data.document !== undefined && data.document !== current.document) {
      diff.document = { from: current.document, to: data.document };
    }
    if (data.phone !== undefined && data.phone !== current.phone) {
      diff.phone = { from: current.phone, to: data.phone };
    }
    if (data.email !== undefined && data.email !== current.email) {
      diff.email = { from: current.email, to: data.email };
    }
    if (
      data.basePrice !== undefined &&
      Number(data.basePrice) !== Number(current.basePrice)
    ) {
      diff.basePrice = {
        from: current.basePrice,
        to: data.basePrice.toString(),
      };
    }
    if (
      data.pricePerKg !== undefined &&
      Number(data.pricePerKg) !== Number(current.pricePerKg)
    ) {
      diff.pricePerKg = {
        from: current.pricePerKg,
        to: data.pricePerKg.toString(),
      };
    }
    if (
      data.deadlineDays !== undefined &&
      data.deadlineDays !== current.deadlineDays
    ) {
      diff.deadlineDays = { from: current.deadlineDays, to: data.deadlineDays };
    }
    if (data.status !== undefined && data.status !== current.status) {
      diff.status = { from: current.status, to: data.status };
    }

    // Se nada mudou, retorna sem alterar banco nem gerar log
    if (Object.keys(diff).length === 0) {
      return current;
    }

    const updatePayload: Record<string, any> = { ...data };

    if (data.basePrice !== undefined) {
      updatePayload.basePrice = data.basePrice.toString();
    }
    if (data.pricePerKg !== undefined) {
      updatePayload.pricePerKg = data.pricePerKg.toString();
    }

    try {
      await this.db.update(carrierSchema).set(updatePayload).where(and(eq(carrierSchema.id, id), eq(carrierSchema.tenantId, tenantId)),);

      const updated = await this.findById(tenantId, id);

      await this.auditService.log({
        tenantId,
        userId: userId ?? null,
        action: 'CARRIER_UPDATE',
        resource: 'carrier',
        resourceId: id,
        details: {
          carrierName: updated.name,
          diff,
        },
      });

      return updated;
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ConflictException(
          'Já existe outra transportadora cadastrada com este nome ou documento nesta empresa',
        );
      }
      throw error;
    }
  }

  async remove(tenantId: string, id: string, userId?: string) {
    const current = await this.findById(tenantId, id);

    await this.db
      .delete(carrierSchema)
      .where(
        and(eq(carrierSchema.tenantId, tenantId), eq(carrierSchema.id, id)),
      );

    await this.auditService.log({
      tenantId,
      userId: userId ?? null,
      action: 'CARRIER_DELETE',
      resource: 'carrier',
      resourceId: id,
      details: {
        name: current.name,
        document: current.document,
      },
    });

    return { message: 'Transportadora removida com sucesso' };
  }

  async findAll(tenantId: string) {
    return this.db.select().from(carrierSchema).where(eq(carrierSchema.tenantId, tenantId)).orderBy(desc(carrierSchema.createdAt));
  }

  async findById(tenantId: string, id: string): Promise<Carrier> {
    const [carrier] = await this.db.select().from(carrierSchema).where(and(eq(carrierSchema.id, id), eq(carrierSchema.tenantId, tenantId))).limit(1);

    if (!carrier) {
      throw new NotFoundException(
        'Transportadora não encontrada nesta empresa',
      );
    }

    return carrier;
  }

  // Importa transportadoras em lote a partir de arquivo CSV
  async importCsv(tenantId: string, fileBuffer: Buffer, userId?: string, originalFilename?: string): Promise<CsvImportResult> {
    const existingRecords = await this.db.select({
      name: carrierSchema.name,
      document: carrierSchema.document,
    }).from(carrierSchema).where(eq(carrierSchema.tenantId, tenantId));

    const existingDocs = new Set(existingRecords.map((r) => r.document.replace(/\D/g, '')));
    const existingNames = new Set(existingRecords.map((r) => r.name.toLowerCase().trim()));

    const { rows, totalProcessed, totalImported, errors } = parseCarriersCsv(fileBuffer,
      tenantId,
      existingDocs,
      existingNames,
    );

    if (rows.length > 0) {
      await insertInBatches(
        (batch) => this.db.insert(carrierSchema).values(batch),
        rows,
      );

      await this.auditService.log({
        tenantId,
        userId: userId ?? null,
        action: 'CARRIER_CREATE',
        resource: 'carrier',
        resourceId: 'batch-import',
        details: {
          importedCount: totalImported,
          totalProcessed,
          fileName: originalFilename || 'transportadoras.csv',
        },
      });
    }

    return {
      totalProcessed,
      totalImported,
      errors,
    };
  }
}
