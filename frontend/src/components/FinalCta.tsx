import { ArrowRight } from 'lucide-react';

export function FinalCta() {
  return (
    <section className="border-b border-zinc-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-7 py-14 text-center shadow-2xl shadow-zinc-900/10 sm:px-12 md:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-amber-400 uppercase">Sua operação, no controle</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Troque consultas dispersas por uma decisão de frete clara.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Centralize seus parceiros, compare as opções disponíveis e preserve o histórico de cada cotação no ambiente da sua empresa.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
              >
                Cadastrar empresa
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-white/5"
              >
                Acessar sistema
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
