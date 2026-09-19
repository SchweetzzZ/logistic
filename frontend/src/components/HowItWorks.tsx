import { Box, Calculator, SlidersHorizontal } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Parametrização & regras de cobrança',
      description:
        'Cada operação cadastra suas transportadoras e define preço base, valor por quilo e prazo médio. Apenas parceiros ativos da empresa participam de cada cotação.',
      icon: SlidersHorizontal,
    },
    {
      number: '02',
      title: 'Motor de cubagem & geometria automática',
      description:
        'O motor compara peso real e peso cubado (C × L × A / 6000), localiza origem e destino pelo CEP e aplica o fator de distância adequado à rota.',
      icon: Box,
    },
    {
      number: '03',
      title: 'Comparação & decisão estratégica',
      description:
        'As opções disponíveis são consolidadas instantaneamente e ordenadas por menor custo, com composição do frete, prazo estimado e peso cobrado visíveis para decisão.',
      icon: Calculator,
    },
  ];

  return (
    <section id="como-funciona" className="scroll-mt-20 border-b border-zinc-200 bg-zinc-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-amber-700 uppercase">Do cadastro à cotação</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
            Como funciona o fluxo
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Uma sequência objetiva para transformar dados da carga em uma decisão de frete rastreável.
          </p>
        </div>
        <ol className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-zinc-400">{step.number}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold tracking-tight text-zinc-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
