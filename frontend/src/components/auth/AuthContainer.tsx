'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandingHero } from './BrandingHero';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export type AuthTab = 'login' | 'register';

interface AuthContainerProps {
  initialTab?: AuthTab;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleForgotPassword = () => {
    setInfoNotice(
      'Para recuperar o acesso, solicite o reenvio de credenciais ao Administrador da sua empresa ou entre em contato com o suporte institucional.',
    );
  };

  return (
    <main className="min-h-screen w-full bg-[#fcfcfd] text-zinc-900 font-sans selection:bg-amber-500/20 selection:text-zinc-900 flex flex-col justify-between">
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">

        {/* Coluna esquerda: Apresentação Institucional em Dark Theme */}
        <aside aria-label="Apresentação institucional" className="hidden lg:block lg:col-span-5 xl:col-span-5 bg-zinc-950 relative border-r border-zinc-900 overflow-hidden">
          <BrandingHero />
        </aside>

        {/* Coluna direita: Painel amplo de autenticação corporativa */}
        <section aria-label="Painel de autenticação" className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 bg-white">

          {/* Top Bar: Voltar para a LogiFlow & Mobile Brand */}
          <div className="flex items-center justify-between w-full max-w-lg mx-auto">
            <Link
              href="/"
              id="link-back-to-logiflow"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Voltar para o início</span>
            </Link>

            {/* Mobile-only brand badge */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <svg
                  className="w-3.5 h-3.5 stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h5l3-6 4 12 3-6h6" />
                </svg>
              </div>
              <span className="font-bold text-sm text-zinc-900">
                Logi<span className="text-amber-500">Flow</span>
              </span>
            </div>
          </div>

          {/* Container Central com Formulários */}
          <div className="w-full max-w-lg mx-auto my-auto py-8">
            {infoNotice && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start justify-between gap-3">
                <span>{infoNotice}</span>
                <button
                  type="button"
                  onClick={() => setInfoNotice(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {activeTab === 'login' ? (
              <div className="space-y-6">
                {/* Cabeçalho Login */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Acesse sua empresa
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-500 leading-relaxed">
                    Entre para consultar cotações, parceiros e a operação logística da sua empresa.
                  </p>
                </div>

                {/* Formulário de Login */}
                <LoginForm onForgotPasswordClick={handleForgotPassword} />

                {/* Divisor discreto */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                </div>

                {/* Alternar para cadastro */}
                <div className="text-center pt-2">
                  <p className="text-sm text-zinc-500">
                    Sua empresa ainda não possui ambiente?{' '}
                    <button
                      type="button"
                      id="btn-switch-to-register"
                      onClick={() => {
                        setInfoNotice(null);
                        setActiveTab('register');
                      }}
                      className="font-medium text-amber-600 hover:text-amber-700 transition-colors focus:outline-none underline-offset-4 hover:underline cursor-pointer"
                    >
                      Cadastrar empresa
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cabeçalho de Cadastro */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Cadastrar empresa
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-500 leading-relaxed">
                    Configure um ambiente dedicado para sua equipe gerenciar fretes e despachos.
                  </p>
                </div>

                {/* Formulário de Cadastro */}
                <RegisterForm onBackToLogin={() => setActiveTab('login')} />

                {/* Divisor discreto */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                </div>

                {/* Voltar para login */}
                <div className="text-center pt-2">
                  <p className="text-sm text-zinc-500">
                    Já possui um ambiente configurado?{' '}
                    <button
                      type="button"
                      id="btn-switch-to-login"
                      onClick={() => {
                        setInfoNotice(null);
                        setActiveTab('login');
                      }}
                      className="font-medium text-amber-600 hover:text-amber-700 transition-colors focus:outline-none underline-offset-4 hover:underline cursor-pointer"
                    >
                      Entrar no sistema
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé institucional com direitos autorais */}
          <div className="w-full max-w-lg mx-auto pt-6 text-center lg:text-left">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} LogiFlow Plataforma de Cargas Ltda. Todos os direitos reservados.
            </p>
          </div>

        </section>
      </div>
    </main>
  );
};
