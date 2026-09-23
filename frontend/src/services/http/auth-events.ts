export const AUTH_SESSION_EXPIRED = 'auth:session-expired';

/**
 * Dispara o evento customizado indicando que a sessão do usuário expirou
 * definitivamente (refresh token inválido, revogado ou expirado).
 */
export function emitSessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED));
  }
}

/**
 * Registra um ouvinte para a expiração de sessão e retorna a função de cleanup
 * para fácil integração com o ciclo de vida do React (useEffect).
 */
export function onSessionExpired(handler: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = () => {
    handler();
  };

  window.addEventListener(AUTH_SESSION_EXPIRED, listener);

  return () => {
    window.removeEventListener(AUTH_SESSION_EXPIRED, listener);
  };
}
