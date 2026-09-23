import { rawClient } from './api';
import type { UserEmployee, CreateEmployeeInput, UpdateEmployeeInput } from '@/src/types';


export const usersService = {
  list: async (): Promise<UserEmployee[]> => {
    try {
      const { data, error } = await rawClient.GET('/user');
      if (error || !data) {
        return [];
      }
      return data as unknown as UserEmployee[];
    } catch {
      return [];
    }
  },

  create: async (payload: CreateEmployeeInput): Promise<{ data?: UserEmployee; error?: string }> => {
    try {
      const { data, error } = await rawClient.POST('/user', {
        body: payload,
      });

      if (error) {
        let msg = 'Falha ao cadastrar colaborador.';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: data as unknown as UserEmployee };
    } catch {
      return { error: 'Erro de conexão ao cadastrar colaborador.' };
    }
  },

  update: async (id: string, payload: UpdateEmployeeInput): Promise<{ data?: UserEmployee; error?: string }> => {
    try {
      const { data, error } = await rawClient.PATCH('/user/{id}', {
        params: {
          path: { id },
        },
        body: payload,
      });

      if (error) {
        let msg = 'Falha ao atualizar colaborador.';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: data as unknown as UserEmployee };
    } catch {
      return { error: 'Erro de conexão ao atualizar colaborador.' };
    }
  },

  remove: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await rawClient.DELETE('/user/{id}', {
        params: {
          path: { id },
        },
      });

      if (error) {
        let msg = 'Falha ao remover colaborador.';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { success: false, error: msg };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão ao remover colaborador.' };
    }
  },
};
