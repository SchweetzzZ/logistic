import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AppNotificationEvent {
  targetUserId?: string;
  targetTenantId?: string;
  type: string;
  data: Record<string, any>;
}

@Injectable()
export class SseNotificationService {
  private readonly logger = new Logger(SseNotificationService.name);
  private readonly events$ = new Subject<AppNotificationEvent>();

  // Envia evento em tempo real para um usuário específico
  sendToUser(userId: string, type: string, data: Record<string, any>): void {
    this.logger.log(`Enviando evento SSE '${type}' para o usuário ${userId}`);
    this.events$.next({ targetUserId: userId, type, data });
  }

  // Envia evento em tempo real para todos os usuários de um mesmo tenant
  sendToTenant(
    tenantId: string,
    type: string,
    data: Record<string, any>,
  ): void {
    this.logger.log(`Enviando evento SSE '${type}' para o tenant ${tenantId}`);
    this.events$.next({ targetTenantId: tenantId, type, data });
  }

  // Retorna o stream reativo de eventos filtrado para a sessão do usuário conectado
  getUserEventStream(
    userId: string,
    tenantId?: string,
  ): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      filter(
        (event) =>
          event.targetUserId === userId ||
          (!!event.targetTenantId && event.targetTenantId === tenantId),
      ),
      map((event) => ({
        data: {
          type: event.type,
          ...event.data,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
