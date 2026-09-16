import { Inject, Injectable, NotFoundException, ConflictException, } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { CreateCarrierDto, UpdateCarrierDto } from './dto/carrier-dto';
import { and, eq, desc } from 'drizzle-orm';
import { carrierSchema, type Carrier } from './schemas/schema';

@Injectable()
export class carrierService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) { }

    async create(tenantId: string, data: CreateCarrierDto): Promise<Carrier> {
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

    async update(tenantId: string, id: string, data: UpdateCarrierDto): Promise<Carrier> {
        await this.findById(tenantId, id);

        const updatePayload: Record<string, any> = { ...data };

        if (data.basePrice !== undefined) {
            updatePayload.basePrice = data.basePrice.toString();
        }
        if (data.pricePerKg !== undefined) {
            updatePayload.pricePerKg = data.pricePerKg.toString();
        }

        try {
            await this.db.update(carrierSchema).set(updatePayload)
                .where(
                    and(
                        eq(carrierSchema.id, id),
                        eq(carrierSchema.tenantId, tenantId),
                    ),
                );

            return this.findById(tenantId, id);
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
                throw new ConflictException(
                    'Já existe outra transportadora cadastrada com este nome ou documento nesta empresa',
                );
            }
            throw error;
        }
    }

    async remove(tenantId: string, id: string) {
        await this.findById(tenantId, id);

        await this.db.delete(carrierSchema).where(and(eq(carrierSchema.tenantId, tenantId), eq(carrierSchema.id, id)))

        return { message: 'Transportadora removida com sucesso' }
    }


    async findAll(tenantId: string) {
        return this.db.select().from(carrierSchema).where
            (eq(carrierSchema.tenantId, tenantId)).orderBy(desc(carrierSchema.createdAt))
    }

    async findById(tenantId: string, id: string): Promise<Carrier> {
        const [carrier] = await this.db.select().from(carrierSchema)
            .where(and(eq(carrierSchema.id, id), eq(carrierSchema.tenantId, tenantId)))
            .limit(1);

        if (!carrier) {
            throw new NotFoundException('Transportadora não encontrada nesta empresa');
        }

        return carrier;
    }


}