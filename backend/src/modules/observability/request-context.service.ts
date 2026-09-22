import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextData {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run: <T>(data: RequestContextData, callback: () => T): T =>
    storage.run(data, callback),

  getStore: (): RequestContextData | undefined => storage.getStore(),

  getRequestId: (): string | undefined => storage.getStore()?.requestId,

  setTenantId(tenantId: string): void {
    const store = storage.getStore();
    if (store) store.tenantId = tenantId;
  },

  setUserId(userId: string): void {
    const store = storage.getStore();
    if (store) store.userId = userId;
  },
};
