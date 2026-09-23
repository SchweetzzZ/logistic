'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { RealtimeNotification } from '@/src/types/reports';
import { reportsService } from '@/src/services/reports';
import { API_BASE_URL } from '@/src/config/api.config';

const STORAGE_KEY = 'logiflow_realtime_notifications';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ReportReadyEventData {
  jobId: string;
  fileName: string;
  downloadUrl: string;
  totalRecords: number;
  message?: string;
}

interface NotificationContextValue {
  notifications: RealtimeNotification[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  activeToasts: RealtimeNotification[];
  latestReportEvent: ReportReadyEventData | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissToast: (id: string) => void;
  downloadFromNotification: (fileName?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    [],
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [activeToasts, setActiveToasts] = useState<RealtimeNotification[]>([]);
  const [latestReportEvent, setLatestReportEvent] =
    useState<ReportReadyEventData | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Carrega notificações prévias do localStorage na montagem
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch {
      // Ignora falhas de parse do cache local
    }
  }, []);

  // Salva no localStorage sempre que as notificações mudarem
  const persistNotifications = (items: RealtimeNotification[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    } catch {
      // Ignora erros de cota do localStorage
    }
  };

  // Gerencia a conexão com o SSE do backend
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Fecha conexão anterior se existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const token = localStorage.getItem('auth_token');
    // Só tenta conectar se houver token ou se estiver em ambiente autenticado
    const streamUrl = token
      ? `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
      : `${API_BASE_URL}/notifications/stream`;

    setConnectionStatus('connecting');

    try {
      const es = new EventSource(streamUrl, {
        withCredentials: true,
      });

      es.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      const handleEventPayload = (rawPayload: any) => {
        const eventType = rawPayload.type || 'NOTIFICATION';
        const data = rawPayload.data || rawPayload;

        if (eventType === 'REPORT_READY') {
          const reportData: ReportReadyEventData = {
            jobId: data.jobId || String(Date.now()),
            fileName: data.fileName || `relatorio-${Date.now()}.csv`,
            downloadUrl: data.downloadUrl || '',
            totalRecords:
              typeof data.totalRecords === 'number' ? data.totalRecords : 0,
            message: data.message || 'Seu relatório está pronto para download!',
          };

          setLatestReportEvent(reportData);

          const newNotif: RealtimeNotification = {
            id: `notif-${reportData.jobId}-${Date.now()}`,
            type: 'REPORT_READY',
            title: 'Relatório Concluído!',
            message:
              reportData.message ||
              `Seu relatório de fretes (${reportData.totalRecords} simulações) foi gerado em segundo plano.`,
            data: reportData,
            timestamp: rawPayload.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => {
            const updated = [newNotif, ...prev.filter((n) => n.id !== newNotif.id)];
            persistNotifications(updated);
            return updated;
          });

          // Aciona toast flutuante
          setActiveToasts((prev) => [newNotif, ...prev.slice(0, 2)]);
        } else {
          // Outros tipos de notificação genérica
          const genericNotif: RealtimeNotification = {
            id: `notif-generic-${Date.now()}`,
            type: eventType,
            title: data.title || 'Nova Notificação',
            message: data.message || 'Atualização do sistema em tempo real.',
            data,
            timestamp: rawPayload.timestamp || new Date().toISOString(),
            read: false,
          };

          setNotifications((prev) => {
            const updated = [genericNotif, ...prev];
            persistNotifications(updated);
            return updated;
          });

          setActiveToasts((prev) => [genericNotif, ...prev.slice(0, 2)]);
        }
      };

      // Listener para onmessage padrão do SSE
      es.onmessage = (event) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          handleEventPayload(parsed);
        } catch (err) {
          console.warn('Erro ao processar mensagem SSE:', err);
        }
      };

      // Listener específico para REPORT_READY caso o NestJS envie com evento customizado
      es.addEventListener('REPORT_READY', (event: any) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          handleEventPayload({ type: 'REPORT_READY', ...parsed });
        } catch (err) {
          console.warn('Erro ao processar evento REPORT_READY:', err);
        }
      });

      es.onerror = () => {
        setConnectionStatus('error');
        es.close();
        eventSourceRef.current = null;

        // Reconexão com backoff exponencial
        const nextAttempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = nextAttempt;
        const delay = Math.min(1000 * Math.pow(2, nextAttempt), 30000);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      };

      eventSourceRef.current = es;
    } catch {
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectSSE]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    persistNotifications([]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const downloadFromNotification = useCallback(async (fileName?: string) => {
    if (!fileName) return;
    await reportsService.downloadReport(fileName);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    connectionStatus,
    activeToasts,
    latestReportEvent,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissToast,
    downloadFromNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext deve ser utilizado dentro de um NotificationProvider',
    );
  }
  return context;
}
