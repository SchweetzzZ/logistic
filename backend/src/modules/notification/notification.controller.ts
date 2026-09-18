import { Controller, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SseNotificationService } from './sse-notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly sseService: SseNotificationService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Conexão em tempo real via Server-Sent Events (SSE)',
    description:
      'Mantém um canal HTTP persistente (EventSource) para notificar o frontend instantaneamente.',
  })
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.sseService.getUserEventStream(user.userId, user.tenantId);
  }
}
