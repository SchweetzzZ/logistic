'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/src/services/api';

interface RegisterFormProps {
  onBackToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    adminName: '',
    email: '',
    password: '',
  });

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

    if (!companyName || !document || !adminName || !email || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await api.POST('/user/register', {
        body: {
          companyName,
          document,
          adminName,
          email,
          password,
        },
      });

      if (error) {
        let msg = 'Falha ao criar ambiente da empresa. Verifique os dados informados.';
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
        // Armazena informações de autenticação localmente
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
          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={loading}
            value={formData.adminName}
            onChange={(e) => handleChange('adminName', e.target.value)}
            placeholder="ex: Carlos Mendes"
            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Campo: E-mail corporativo */}
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
          disabled={loading}
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="carlos@suaempresa.com.br"
          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Campo: Senha de acesso */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-password"
          className="block text-sm font-medium text-zinc-900"
        >
          Senha de acesso
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
            placeholder="Mínimo 6 caracteres"
            className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 text-sm rounded-xl bg-white text-zinc-900 border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-zinc-400 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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

      {/* Botão de cadastro corporativo */}
      <div className="pt-2">
        <button
          type="submit"
          id="btn-register-submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm sm:text-base text-white bg-zinc-900 hover:bg-black active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Criando ambiente corporativo...</span>
            </>
          ) : (
            <span>Criar ambiente corporativo</span>
          )}
        </button>
      </div>
    </form>
  );
};
