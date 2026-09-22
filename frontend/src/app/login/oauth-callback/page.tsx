'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      try {
        localStorage.setItem('auth_token', token);
      } catch {
        // Ignora falha de localstorage
      }
      router.push('/dashboard');
      return;
    }

    if (error) {
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // Se nenhum token ou erro, fallback para login
    router.push('/login');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200/80 flex flex-col items-center max-w-sm w-full text-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <h2 className="text-base font-semibold text-zinc-900">
          Autenticando sua sessão...
        </h2>
        <p className="text-xs text-zinc-500">
          Estamos configurando seu acesso com o provedor social. Você será
          redirecionado em instantes.
        </p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
