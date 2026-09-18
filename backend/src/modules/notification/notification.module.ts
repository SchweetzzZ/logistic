import { Module } from '@nestjs/common';
import { SseNotificationService } from './sse-notification.service';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [SseNotificationService],
  exports: [SseNotificationService],
})
export class NotificationModule {}
