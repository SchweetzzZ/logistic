import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './service';
import { UserController } from './controller';
import { TenantModule } from '../tenant/module';

@Module({
  imports: [ConfigModule, TenantModule, JwtModule.register({})],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
