import { SseNotificationService } from './sse-notification.service';
import { firstValueFrom, take } from 'rxjs';

describe('SseNotificationService', () => {
  let service: SseNotificationService;

  beforeEach(() => {
    service = new SseNotificationService();
  });

  it('deve emitir evento para o usuário específico', async () => {
    const userId = 'user-123';
    const stream$ = service.getUserEventStream(userId);

    const promise = firstValueFrom(stream$.pipe(take(1)));

    service.sendToUser(userId, 'REPORT_READY', { jobId: 'job-1' });

    const message = await promise;
    expect(message).toBeDefined();
    const data = message.data as { type: string; jobId: string };
    expect(data.type).toBe('REPORT_READY');
    expect(data.jobId).toBe('job-1');
  });

  it('não deve emitir para usuário com ID diferente', (done) => {
    const userId = 'user-123';
    const otherUserId = 'user-999';

    const stream$ = service.getUserEventStream(userId);

    const subscription = stream$.subscribe(() => {
      done.fail('Não deveria ter recebido evento destinado a outro usuário');
    });

    service.sendToUser(otherUserId, 'REPORT_READY', { jobId: 'job-2' });

    setTimeout(() => {
      subscription.unsubscribe();
      done();
    }, 50);
  });
});
