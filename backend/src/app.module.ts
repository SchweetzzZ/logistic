import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { CommonModule } from './modules/common/common.module';
import { TenantModule } from './modules/tenant/module';
import { UserModule } from './modules/user/module';
import { CustomerManagementModule } from './modules/customer-management/module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    CommonModule,
    TenantModule,
    UserModule,
    CustomerManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
