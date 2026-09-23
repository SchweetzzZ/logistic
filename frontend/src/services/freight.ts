import { rawClient } from './api';
import type { SimulateFreightInput, SimulationResult, FreightHistoryResponse } from '@/src/types';

export const freightService = {
  simulate: async (payload: SimulateFreightInput): Promise<{ data?: SimulationResult; error?: string }> => {
    const { data, error } = await rawClient.POST('/freight/simulate', {
      body: payload,
    });

    if (error) {
      let msg = 'Falha ao calcular cotação de frete.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as { message?: unknown }).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { error: msg };
    }

    return { data: data as unknown as SimulationResult };
  },

  getHistory: async (
    page = 1,
    limit = 20,
  ): Promise<FreightHistoryResponse> => {
    const { data, error } = await rawClient.GET('/freight/history', {
      params: {
        query: {
          page,
          limit,
        },
      },
    });

    if (error || !data) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    return data as unknown as FreightHistoryResponse;
  },
};
