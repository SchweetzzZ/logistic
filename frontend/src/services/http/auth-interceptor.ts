import { emitSessionExpired } from './auth-events';
import { API_BASE_URL } from '@/src/config/api.config';

const API_URL = API_BASE_URL;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          credentials: 'include',
        });

        if (res.ok) {
          console.log('[Auth] Token renovado com sucesso via HttpOnly');
          return true;
        }

        const errorDetails = await res.text();
        console.warn(`[Auth] Falha no refresh token (${res.status}):`, errorDetails);
        return false;
      } catch (err) {
        console.error('[Auth] Erro de rede ao tentar refresh token:', err);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit,): Promise<Response> => {
  const req = input instanceof Request ? input : new Request(input, init);

  // Ignora rotas de autenticação para evitar loops
  if (req.url.includes('/login') || req.url.includes('/refresh-token') || req.url.includes('/logout')) {
    return fetch(req)
  }

  // Clona a requisição para permitir reexecução segura caso tome 401
  let retryReq: Request | null = null
  try {
    retryReq = req.clone()
  } catch {
    retryReq = null
  }

  if (refreshPromise) await refreshPromise

  const res = await fetch(req);

  // 401 detectado: tenta renovar silenciosamente
  if (res.status === 401) {
    console.log('[Auth] 401 detectado em', req.url, '- disparando refresh...')
    const ok = await refreshToken()

    if (ok) {
      console.log('[Auth] Repetindo requisição original para', req.url)
      // Reenvia usando a requisição clonada ou recria com credentials
      if (retryReq) {
        return fetch(retryReq)
      }
      return fetch(req.url, { ...init, credentials: 'include' })
    }

    console.warn('[Auth] Sessão expirada definitivamente. Redirecionando...');
    emitSessionExpired()
  }

  return res
};
