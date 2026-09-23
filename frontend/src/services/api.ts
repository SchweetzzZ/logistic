import createClient from 'openapi-fetch';
import type { paths } from '@/src/api/schema';
import { customFetch } from './http/auth-interceptor';
import { API_BASE_URL } from '@/src/config/api.config';

const baseUrl = API_BASE_URL;

export const rawClient = createClient<paths>({
  baseUrl,
  credentials: 'include',
  fetch: customFetch,
});

export const api = rawClient;
export default api;
