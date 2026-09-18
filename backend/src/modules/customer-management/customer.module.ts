import { Module } from '@nestjs/common';
import { CustomerManagementController } from './customer.controller';
import { CustomerManagementService } from './customer.service';

@Module({
  controllers: [CustomerManagementController],
  providers: [CustomerManagementService],
  exports: [CustomerManagementService],
})
export class CustomerManagementModule {}
