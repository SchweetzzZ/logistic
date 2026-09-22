import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { CommonModule } from './modules/common/common.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { CustomerManagementModule } from './modules/customer-management/customer.module';
import { CarrierManagementModule } from './modules/carrier-management/carrier.module';
import { FreightModule } from './modules/freight/freight.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ObservabilityModule } from './modules/observability/observability.module';

import { authConfig } from './config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      envFilePath: ['.env'],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    DatabaseModule,
    ObservabilityModule,
    CommonModule,
    AuditModule,
    NotificationModule,
    TenantModule,
    UserModule,
    CustomerManagementModule,
    CarrierManagementModule,
    FreightModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
