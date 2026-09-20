import { rawClient } from './api';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/src/types';

export const customersService = {
  list: async (search?: string): Promise<Customer[]> => {
    const { data, error } = await rawClient.GET('/customers', {
      params: {
        query: search ? { search } : undefined,
      },
    });
    if (error || !data) {
      return [];
    }
    return data as unknown as Customer[];
  },

  getById: async (id: string): Promise<Customer | null> => {
    const { data, error } = await rawClient.GET('/customers/{id}', {
      params: {
        path: { id },
      },
    });
    if (error || !data) {
      return null;
    }
    return data as unknown as Customer;
  },

  create: async (payload: CreateCustomerInput): Promise<{ data?: Customer; error?: string }> => {
    const { data, error } = await rawClient.POST('/customers', {
      body: payload as any,
    });
    if (error) {
      let msg = 'Falha ao cadastrar cliente.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { error: msg };
    }
    return { data: data as unknown as Customer };
  },

  update: async (
    id: string,
    payload: UpdateCustomerInput,
  ): Promise<{ data?: Customer; error?: string }> => {
    const { data, error } = await rawClient.PATCH('/customers/{id}', {
      params: {
        path: { id },
      },
      body: payload as any,
    });
    if (error) {
      let msg = 'Falha ao atualizar cliente.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { error: msg };
    }
    return { data: data as unknown as Customer };
  },

  delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await rawClient.DELETE('/customers/{id}', {
      params: {
        path: { id },
      },
    });
    if (error) {
      let msg = 'Falha ao excluir cliente.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as any).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { success: false, error: msg };
    }
    return { success: true };
  },
};
