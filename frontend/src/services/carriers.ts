import { rawClient } from './api';
import type { Carrier, CreateCarrierInput, UpdateCarrierInput, CarrierImportResult } from '@/src/types';
import { API_BASE_URL } from '@/src/config/api.config';

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
      body: payload,
    });
    if (error) {
      let msg = 'Falha ao cadastrar transportadora.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as { message?: unknown }).message;
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
      body: payload,
    });
    if (error) {
      let msg = 'Falha ao atualizar transportadora.';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const m = (error as { message?: unknown }).message;
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
        const m = (error as { message?: unknown }).message;
        msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      return { success: false, error: msg };
    }
    return { success: true };
  },

  // Importa lista de transportadoras via upload de arquivo CSV
  importCsv: async (
    file: File,
  ): Promise<{ data?: CarrierImportResult; error?: string }> => {
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

      const response = await fetch(`${baseUrl}/carriers/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        let msg = 'Falha ao importar transportadoras.';
        if (json && typeof json === 'object' && 'message' in json) {
          const m = (json as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: json };
    } catch {
      return {
        error: 'Erro de conexão com o servidor ao importar o arquivo CSV.',
      };
    }
  },
};
