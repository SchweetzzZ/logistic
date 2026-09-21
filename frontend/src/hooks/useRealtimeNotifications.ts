// Hook de Notificações em Tempo Real via Server-Sent Events (SSE)

import { useNotificationContext } from '@/src/context/NotificationContext';

export function useRealtimeNotifications() {
  return useNotificationContext();
}

export default useRealtimeNotifications;
