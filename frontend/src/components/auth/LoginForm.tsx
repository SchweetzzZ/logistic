'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/src/services/api';

interface LoginFormProps {
  onForgotPasswordClick?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPasswordClick,
}) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      const { data, error } = await api.POST('/user/login', {
        body: {
          email: trimmedEmail,
          password,
        },
      });

      if (error) {
        // Trata respostas de erro do backend NestJS / Zod
        let msg = 'Falha ao autenticar. Verifique suas credenciais.';
        if (typeof error === 'object' && error !== null) {
          if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
            msg = (error as { message: string }).message;
          } else if ('message' in error && Array.isArray((error as { message: unknown }).message)) {
            msg = ((error as { message: string[] }).message).join(', ');
          }
        }
        setErrorMessage(msg);
        return;
      }

      if (data) {
        // Armazena informações no cliente para hidratação imediata
        try {
          if (data.accessToken) {
            localStorage.setItem('auth_token', data.accessToken);
          }
          if (data.user) {
            localStorage.setItem('auth_user', JSON.stringify(data.user));
          }
        } catch {
          // Ignora se localStorage estiver indisponível
        }

        // Redireciona para o dashboard corporativo
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Erro ao realizar login:', err);
      setErrorMessage('Erro de conexão com o servidor. Verifique se o backend está em execução.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Aviso informativo de segurança corporativa */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-600 text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>Acesso exclusivo para colaboradores internos autorizados.</span>
      </div>

      {/* Alerta de erro */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

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
          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
          className="w-full py-3 px-4 rounded-xl font-medium text-sm sm:text-base text-white bg-zinc-900 hover:bg-black active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
};
