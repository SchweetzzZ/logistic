import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white px-4 pb-24 pt-36 sm:px-6 md:pb-32 md:pt-48 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/70 via-white to-white" />
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
            href="/simular-frete"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-amber-400 hover:shadow-amber-500/20 sm:w-auto"
          >
            Simular frete agora <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto"
          >
            Cadastrar empresa
          </a>
        </div>
        <p className="mt-6 text-xs text-zinc-500">Operação separada por empresa, usuários e transportadoras autorizadas.</p>
      </div>
    </section>
  );
}
