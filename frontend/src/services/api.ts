import createClient from 'openapi-fetch';
import type { paths } from '@/src/api/schema';
import type { DashboardData, Quote, UserProfile, CompanyInfo } from '@/src/types';

export const api = Object.assign(
  createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    credentials: 'include', // Envia e recebe automaticamente os cookies HttpOnly (JWT e Refresh Token)
  }),
  {
    // Métodos utilitários de compatibilidade enquanto telas específicas integram as rotas do backend
    getDashboardData: async (): Promise<DashboardData | null> => {
      return null;
    },
    getRecentQuotes: async (_limit: number = 10): Promise<Quote[]> => {
      return [];
    },
    getCurrentUser: async (): Promise<UserProfile | null> => {
      return null;
    },
    getCompanyInfo: async (): Promise<CompanyInfo | null> => {
      return null;
    },
  },
);

export default api;
