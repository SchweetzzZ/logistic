import { Module } from '@nestjs/common';
import { TenantService } from './service';
import { TenantController } from './controller';

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
