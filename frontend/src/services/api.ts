import createClient from 'openapi-fetch';
import type { paths } from '@/src/api/schema';

export const rawClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  credentials: 'include', // Envia e recebe automaticamente os cookies HttpOnly (jwt e refresh_token)
});

// Middleware para anexar o token Bearer caso armazenado no cliente (redundância segura além do cookie HttpOnly)
rawClient.use({
  onRequest({ request }) {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Ignora se localStorage não estiver disponível
      }
    }
    return request;
  },
});

export const api = rawClient;
export default api;
