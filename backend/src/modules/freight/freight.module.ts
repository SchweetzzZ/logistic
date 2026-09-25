import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FreightController } from './freight.controller';
import { FreightService } from './freight.service';
import { FreightReportController } from './reports/freight-report.controller';
import { FreightReportProcessor } from './reports/freight-report.processor';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'freight-reports',
    }),
    NotificationModule,
  ],
  controllers: [FreightController, FreightReportController],
  providers: [FreightService, FreightReportProcessor],
  exports: [FreightService],
})
export class FreightModule { }
