import React from 'react';

export const BrandingHero: React.FC = () => {
  return (
    <div className="relative flex flex-col justify-between h-full p-10 lg:p-14 text-white overflow-hidden select-none">
      {/* Background com imagem cinemática de logística e overlay escuro de alto contraste */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter saturate-[0.8] contrast-[1.05]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80')`,
        }}
      />

      {/* Gradientes escuros com transição profunda */}
      <div className="absolute inset-0 bg-linear-to-tr from-zinc-950 via-zinc-950/90 to-zinc-900/80" />

      {/* Gráfico sutil vetorial simulando malha de rotas logísticas */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none stroke-amber-500/40" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 200 C 150 100, 300 450, 600 350 S 900 150, 1200 250" fill="none" strokeWidth="1.5" strokeDasharray="6 8" />
        <path d="M-50 450 C 200 350, 400 600, 750 480 S 950 300, 1300 400" fill="none" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="300" cy="450" r="3" fill="#f59e0b" />
        <circle cx="600" cy="350" r="4" fill="#f59e0b" />
        <circle cx="750" cy="480" r="3" fill="#f59e0b" />
      </svg>

      {/* Aura atmosférica com brilho suave em tom âmbar */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Seção Superior: Logotipo LogiFlow com ícone estilizado */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shadow-amber-500/10">
            <svg
              className="w-5 h-5 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h5l3-6 4 12 3-6h6" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            Logi<span className="text-amber-500">Flow</span>
          </span>
        </div>
      </div>

      {/* Seção Central: Proposta de Valor Corporativa */}
      <div className="relative z-10 max-w-sm space-y-3 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/25 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Acesso Corporativo Seguro
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
          Inteligência logística para empresas
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed font-normal">
          Centralize a gestão de cargas, auditoria de romaneios e integração com parceiros em uma única plataforma dedicada.
        </p>
      </div>

      {/* Seção Inferior: Slogan institucional */}
      <div className="relative z-10 pt-6 border-t border-zinc-800/80">
        <p className="text-xs text-zinc-400 leading-relaxed">
          Gestão de fretes para operações que precisam decidir melhor.
        </p>
      </div>
    </div>
  );
};
