import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { CommonModule } from './modules/common/common.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
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
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          return {
            connection: {
              url: redisUrl,
            },
          };
        }

        return {
          connection: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
            password: process.env.REDIS_PASSWORD,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 segundos
        limit: 100, // 100 req/min por IP padrão para a API
      },
    ]),
    DatabaseModule,
    ObservabilityModule,
    CommonModule,
    AuditModule,
    NotificationModule,
    TenantModule,
    UserModule,
    AuthModule,
    CustomerManagementModule,
    CarrierManagementModule,
    FreightModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
