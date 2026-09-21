import { rawClient } from './api';
import type { AuditFilterParams, AuditLogItem, AuditLogPaginatedResponse } from '@/src/types';

export const auditService = {
  list: async (filters?: AuditFilterParams): Promise<AuditLogPaginatedResponse> => {
    const { data, error } = await rawClient.GET('/audit', {
      params: {
        query: filters,
      },
    });

    if (error || !data) {
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        totalPages: 0,
      };
    }

    return data as unknown as AuditLogPaginatedResponse;
  },

  getById: async (id: string): Promise<AuditLogItem | null> => {
    const { data, error } = await rawClient.GET('/audit/{id}', {
      params: {
        path: { id },
      },
    });

    if (error || !data) {
      return null;
    }

    return data as unknown as AuditLogItem;
  },
};
