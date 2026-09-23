/**
 * Configuração centralizada da URL da API Backend.
 * Obtida estritamente da variável de ambiente pública do Next.js.
 */
export const API_BASE_URL: string = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== 'undefined') {
      console.error(
        '[API Config] NEXT_PUBLIC_API_URL não está configurada nas variáveis de ambiente!',
      );
    }
    return '';
  }
  return url.replace(/\/+$/, ''); // Remove barras finais caso tenham sido inseridas
})();
