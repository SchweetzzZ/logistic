import { Controller, Post, Delete, Get, Put, Patch, Body } from "@nestjs/common"
import { carrierService } from "./carrier.service";
import { CreateCarrierDto } from "./dto/carrier-dto";
import { CurrentTenant } from "../common/decorators/current-tenant.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../common/enums/role.enum";

@Controller('/carriers')
export class carrierController {
    constructor(private readonly carrierService: carrierService) { }

    @Post()
    @Roles(Role.ADMIN, Role.MANAGER)
    async create(@CurrentTenant() tenantId: string, @Body() data: CreateCarrierDto,) {
        return this.carrierService.create(tenantId, data)
    }
}