import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, type DrizzleDB } from "../database/database.module";
import { CreateCarrierDto } from "./dto/carrier-dto";
import { and, eq } from "drizzle-orm";
import { carrierSchema } from "./schemas/schema";

@Injectable()
export class carrierService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB
    ) { }

    async create(tenantId: string, data: CreateCarrierDto) {
        const [existing] = await this.db.select().from(carrierSchema).where(
            and(eq(carrierSchema.tenantId, tenantId), eq(carrierSchema.document, data.document))
        ).limit(1)

        if (existing) {
            throw new Error("Transportadora ja cadastrada com esse documento")
        }

        await this.db.insert(carrierSchema).values(
            {
                ...data,
                basePrice: data.basePrice.toString(),
                pricePerKg: data.pricePerKg.toString(),
                tenantId,
            }
        )

        const [created] = await this.db.select().from(carrierSchema).where(
            and(eq(carrierSchema.tenantId, tenantId), eq(carrierSchema.document, data.document))
        ).limit(1)

        return created
    }
}