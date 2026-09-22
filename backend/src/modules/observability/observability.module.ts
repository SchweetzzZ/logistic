import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
