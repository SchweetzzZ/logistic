import { rawClient } from './api';
import type { Tenant, UpdateTenantInput } from '@/src/types';

export const tenantService = {
  getCurrent: async (): Promise<Tenant | null> => {
    try {
      const { data, error } = await rawClient.GET('/tenant/current');
      if (error || !data) {
        return null;
      }
      return data as Tenant;
    } catch {
      return null;
    }
  },

  updateCurrent: async (
    payload: UpdateTenantInput,
  ): Promise<{ data?: Tenant; error?: string }> => {
    try {
      const { data, error } = await rawClient.PATCH('/tenant/current', {
        body: payload,
      });

      if (error) {
        let msg = 'Falha ao atualizar dados da empresa.';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: data as Tenant };
    } catch {
      return { error: 'Erro de conexão ao atualizar dados da empresa.' };
    }
  },
};
