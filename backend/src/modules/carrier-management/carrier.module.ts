import { Module } from '@nestjs/common';
import { carrierController } from './carrier.controller';
import { carrierService } from './carrier.service';

@Module({
  controllers: [carrierController],
  providers: [carrierService],
  exports: [carrierService],
})
export class CarrierManagementModule {}
