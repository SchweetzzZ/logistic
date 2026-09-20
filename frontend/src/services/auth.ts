import { rawClient } from './api';
import type { UserProfile, CompanyInfo } from '@/src/types';

export const authService = {
  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await rawClient.GET('/user/me');
      if (data && !error) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          initials: data.name
            ? data.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : undefined,
        };
      }
    } catch {
      // Ignora erro de rede em tempo de execução
    }

    // Fallback: recupera dados cacheados localmente se houver
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('auth_user');
        if (cached) {
          const u = JSON.parse(cached) as { id: string; name: string; email: string; role: string };
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            initials: u.name
              ? u.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : undefined,
          };
        }
      } catch {
        // Ignora falha de parse
      }
    }

    return null;
  },

  getCompanyInfo: async (): Promise<CompanyInfo | null> => {
    try {
      const { data, error } = await rawClient.GET('/tenant/current');
      if (data && !error) {
        return {
          id: data.id,
          name: data.name,
          environment: 'Ambiente Corporativo',
        };
      }
    } catch {
      // Ignora erro de rede em tempo de execução
    }
    return null;
  },

  logout: async (): Promise<void> => {
    try {
      await rawClient.POST('/user/logout');
    } catch {
      // Falha silenciosa
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        } catch {
          // Ignora falha de acesso a storage
        }
      }
    }
  },
};
