'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/src/services/api';

interface RegisterFormProps {
  onBackToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parâmetros de Onboarding OAuth
  const oauthProvider = searchParams.get('oauth');
  const oauthToken = searchParams.get('token');
  const oauthName = searchParams.get('name');
  const oauthEmail = searchParams.get('email');
  const isOAuthOnboarding = Boolean(oauthProvider && oauthToken);

  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    adminName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isOAuthOnboarding) {
      setFormData((prev) => ({
        ...prev,
        adminName: oauthName ? decodeURIComponent(oauthName) : '',
        email: oauthEmail ? decodeURIComponent(oauthEmail) : '',
      }));
    }
  }, [isOAuthOnboarding, oauthName, oauthEmail]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const companyName = formData.companyName.trim();
    const document = formData.cnpj.trim();
    const adminName = formData.adminName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!companyName || !document || !adminName || !email) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isOAuthOnboarding && (!password || password.length < 6)) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      let responseData: any = null;
      let responseError: any = null;

      if (isOAuthOnboarding && oauthToken) {
        // Conclusão de onboarding OAuth
        const res = await (api as any).POST('/user/register-oauth', {
          body: {
            onboardingToken: oauthToken,
            companyName,
            document,
          },
        });
        responseData = res.data;
        responseError = res.error;
      } else {
        // Cadastro comum com senha
        const res = await (api as any).POST('/user/register', {
          body: {
            companyName,
            document,
            adminName,
            email,
            password,
          },
        });
        responseData = res.data;
        responseError = res.error;
      }

      if (responseError) {
        let msg = 'Falha ao criar ambiente da empresa. Verifique os dados informados.';
        if (typeof responseError === 'object' && responseError !== null) {
          if ('message' in responseError && typeof (responseError as any).message === 'string') {
            msg = (responseError as any).message;
          } else if ('message' in responseError && Array.isArray((responseError as any).message)) {
            msg = ((responseError as any).message).join(', ');
          }
        }
        setErrorMessage(msg);
        return;
      }

      if (responseData) {
        // Armazena informações de autenticação localmente
        try {
          if (responseData.accessToken) {
            localStorage.setItem('auth_token', responseData.accessToken);
          }
          if (responseData.user) {
            localStorage.setItem('auth_user', JSON.stringify(responseData.user));
          }
        } catch {
          // Ignora se localStorage estiver indisponível
        }

        // Redireciona diretamente para o dashboard
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Erro ao registrar empresa:', err);
      setErrorMessage('Erro de conexão com o servidor. Verifique se o backend está em execução.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
      {/* Banner informativo quando vem de login social */}
      {isOAuthOnboarding && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Quase lá! Seus dados foram autenticados via{' '}
            <b className="capitalize">{oauthProvider}</b>. Agora, informe os dados da sua empresa para concluir o acesso.
          </span>
        </div>
      )}

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

      {/* Campo: Nome da empresa */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-company-name"
          className="block text-sm font-medium text-zinc-900"
        >
          Nome da empresa
        </label>
        <input
          id="register-company-name"
          name="companyName"
          type="text"
          required
          disabled={loading}
          value={formData.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
          placeholder="ex: Logística do Brasil S.A."
          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Campo: CNPJ / Documento */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-cnpj"
            className="block text-sm font-medium text-zinc-900"
          >
            CNPJ
          </label>
          <input
            id="register-cnpj"
            name="cnpj"
            type="text"
            required
            disabled={loading}
            value={formData.cnpj}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Campo: Nome do responsável */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-admin-name"
            className="block text-sm font-medium text-zinc-900"
          >
            Nome do responsável
          </label>
          <input
            id="register-admin-name"
            name="adminName"
            type="text"
            required
            disabled={loading || isOAuthOnboarding}
            value={formData.adminName}
            onChange={(e) => handleChange('adminName', e.target.value)}
            placeholder="Seu nome completo"
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-75 disabled:bg-zinc-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Campo: E-mail de acesso corporativo */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-zinc-900"
        >
          E-mail corporativo
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading || isOAuthOnboarding}
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="admin@suaempresa.com.br"
          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-75 disabled:bg-zinc-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Campo: Senha (oculto se for cadastro via OAuth) */}
      {!isOAuthOnboarding && (
        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-zinc-900"
          >
            Senha mestre
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              disabled={loading}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="No mínimo 6 caracteres"
              className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 text-sm rounded-xl bg-white border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              id="toggle-register-password-visibility"
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
      )}

      {/* Botão sólido para submissão */}
      <div className="pt-2">
        <button
          type="submit"
          id="btn-register-submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm sm:text-base text-white bg-zinc-900 hover:bg-black active:scale-[0.98] transition-all duration-150 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Configurando ambiente corporativo...</span>
            </>
          ) : (
            <span>{isOAuthOnboarding ? 'Concluir Cadastro da Empresa' : 'Cadastrar Empresa'}</span>
          )}
        </button>
      </div>
    </form>
  );
};
