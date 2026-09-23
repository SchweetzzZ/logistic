import { rawClient } from './api';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/src/types';
import { API_BASE_URL } from '@/src/config/api.config';

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
      body: payload,
    });
    if (error) {
      let msg = 'Falha ao cadastrar cliente.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as { message?: unknown }).message;
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
      body: payload,
    });
    if (error) {
      let msg = 'Falha ao atualizar cliente.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as { message?: unknown }).message;
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
        const m = (error as { message?: unknown }).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { success: false, error: msg };
    }
    return { success: true };
  },

  // Importa lista de clientes via upload de arquivo CSV
  importCsv: async (file: File): Promise<{ data?: { totalProcessed: number; totalImported: number; errors: { row: number; error: string }[]; }; error?: string; }> => {
    try {
      const baseUrl = API_BASE_URL;
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${baseUrl}/customers/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        let msg = 'Falha ao importar clientes.';
        if (json && typeof json === 'object' && 'message' in json) {
          const m = (json as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: json };
    } catch {
      return { error: 'Erro de conexão com o servidor ao importar o arquivo CSV.' };
    }
  },
};
