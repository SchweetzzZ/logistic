import { Module } from '@nestjs/common';
import { CustomerManagementController } from './controller';
import { CustomerManagementService } from './service';

@Module({
  controllers: [CustomerManagementController],
  providers: [CustomerManagementService],
  exports: [CustomerManagementService],
})
export class CustomerManagementModule {}
