'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/src/services/api';

interface LoginFormProps {
  onForgotPasswordClick?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPasswordClick,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Verifica se veio redirecionado com erro de OAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (errorParam) {
      if (errorParam === 'oauth_failed') {
        setErrorMessage('Falha na autenticação com o provedor social. Tente novamente.');
      } else {
        setErrorMessage(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams]);

  // Login tradicional por e-mail e senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await (api as any).POST('/user/login', {
        body: {
          email: trimmedEmail,
          password,
        },
      });

      if (error) {
        let msg = 'Falha ao autenticar. Verifique suas credenciais.';
        if (typeof error === 'object' && error !== null) {
          if ('message' in error && typeof (error as any).message === 'string') {
            msg = (error as any).message;
          } else if ('message' in error && Array.isArray((error as any).message)) {
            msg = (error as any).message.join(', ');
          }
        }
        setErrorMessage(msg);
        return;
      }

      if (data) {
        // Login direto bem-sucedido:
        if (data.accessToken) {
          localStorage.setItem('auth_token', data.accessToken);
        }
        if (data.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }

        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Erro ao realizar login:', err);
      setErrorMessage('Erro de conexão com o servidor. Verifique se o backend está em execução.');
    } finally {
      setLoading(false);
    }
  };

  // Formulário padrão
  return (
    <div className="space-y-4 pt-1">
      {/* Aviso informativo de segurança corporativa */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-600 text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Acesso exclusivo para colaboradores internos autorizados.</span>
      </div>

      {/* Alerta de erro */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Botões de Login Social (OAuth) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <a
          href={`${apiUrl}/user/auth/google`}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50/80 active:scale-[0.98] transition-all text-xs sm:text-sm font-medium text-zinc-700 shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </a>

        <a
          href={`${apiUrl}/user/auth/github`}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50/80 active:scale-[0.98] transition-all text-xs sm:text-sm font-medium text-zinc-700 shadow-2xs"
        >
          <svg className="w-4 h-4 fill-zinc-900" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
        </a>
      </div>

      {/* Divisor "ou continue com e-mail" */}
      <div className="relative my-4 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <span className="relative bg-white px-2.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          ou via e-mail e senha
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: E-mail corporativo */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-zinc-900"
          >
            E-mail corporativo
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@suaempresa.com.br"
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Campo: Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-zinc-900"
            >
              Senha
            </label>
            <button
              type="button"
              id="forgot-password-link"
              disabled={loading}
              onClick={onForgotPasswordClick}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none cursor-pointer"
            >
              Esqueceu sua senha?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              id="toggle-login-password-visibility"
              tabIndex={-1}
              disabled={loading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botão sólido escuro "Acessar sistema" com estado de loading */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-login-submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm sm:text-base text-white bg-zinc-900 hover:bg-black active:scale-[0.98] transition-all duration-150 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Acessando ambiente...</span>
              </>
            ) : (
              <span>Acessar sistema</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
