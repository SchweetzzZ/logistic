import { rawClient } from './api';
import type { Carrier, CreateCarrierInput, UpdateCarrierInput } from '@/src/types';

export const carriersService = {
  list: async (): Promise<Carrier[]> => {
    const { data, error } = await rawClient.GET('/carriers');
    if (error || !data) {
      return [];
    }
    return data as unknown as Carrier[];
  },

  getById: async (id: string): Promise<Carrier | null> => {
    const { data, error } = await rawClient.GET('/carriers/{id}', {
      params: {
        path: { id },
      },
    });
    if (error || !data) {
      return null;
    }
    return data as unknown as Carrier;
  },

  create: async (payload: CreateCarrierInput): Promise<{ data?: Carrier; error?: string }> => {
    const { data, error } = await rawClient.POST('/carriers', {
      body: payload as any,
    });
    if (error) {
      let msg = 'Falha ao cadastrar transportadora.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { error: msg };
    }
    return { data: data as unknown as Carrier };
  },

  update: async (
    id: string,
    payload: UpdateCarrierInput,
  ): Promise<{ data?: Carrier; error?: string }> => {
    const { data, error } = await rawClient.PATCH('/carriers/{id}', {
      params: {
        path: { id },
      },
      body: payload as any,
    });
    if (error) {
      let msg = 'Falha ao atualizar transportadora.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { error: msg };
    }
    return { data: data as unknown as Carrier };
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await rawClient.DELETE('/carriers/{id}', {
      params: {
        path: { id },
      },
    });
    if (error) {
      let msg = 'Falha ao excluir transportadora.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { success: false, error: msg };
    }
    return { success: true };
  },
};
