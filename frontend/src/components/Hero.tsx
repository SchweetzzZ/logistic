import { ArrowRight, Check, ChevronDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white px-4 pb-10 pt-36 sm:px-6 md:pb-12 md:pt-48 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-136 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-100/70 via-white to-white" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="mb-6 text-sm font-medium tracking-[0.14em] text-amber-700 uppercase">Inteligência logística para empresas</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-zinc-950 sm:text-6xl sm:leading-[1.08]">
          Cotação inteligente de fretes, sem planilhas ou intermediários.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
          Conecte sua empresa a transportadoras homologadas. Calcule cubagem automática e encontre a melhor opção de frete em segundos.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#planos"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-amber-400 hover:shadow-amber-500/20 sm:w-auto"
          >
            Conhecer planos & cadastrar <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        {/* Micro-badges de confiança */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-amber-600" aria-hidden="true" />
            14 dias de teste grátis
          </span>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-amber-600" aria-hidden="true" />
            Sem cartão de crédito
          </span>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-amber-600" aria-hidden="true" />
            Ativação imediata
          </span>
        </div>

        {/* Indicador sutil de continuidade */}
        <div className="mt-8 flex justify-center">
          <a
            href="#como-funciona"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition hover:text-amber-600 focus:outline-none"
            aria-label="Rolar para a seção Como funciona"
          >
            <span>Como funciona</span>
            <ChevronDown className="size-3.5 animate-bounce transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
