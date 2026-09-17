import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

import { authConfig } from './config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    CommonModule,
    AuditModule,
    TenantModule,
    UserModule,
    CustomerManagementModule,
    CarrierManagementModule,
    FreightModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
