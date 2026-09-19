import { ArrowUpRight, FileDown, ScanLine, ShieldCheck } from 'lucide-react';

const capabilities = [
  {
    icon: ScanLine,
    title: 'Auditoria de cubagem',
    description:
      'Registre e consulte peso real, peso cubado e peso cobrado em cada simulação para investigar divergências e sustentar uma conferência de frete mais precisa.',
  },
  {
    icon: FileDown,
    title: 'Histórico & relatórios consolidados',
    description:
      'Centralize as cotações realizadas pela empresa, filtre o histórico e solicite exportações em CSV para análises financeiras e operacionais.',
  },
  {
    icon: ShieldCheck,
    title: 'Prazos cotados com transparência',
    description:
      'Compare os prazos configurados pelas transportadoras junto com custo, rota e composição da cobrança antes de definir o parceiro ideal.',
  },
];

export function IntelligenceSection() {
  return (
    <section id="inteligencia" className="scroll-mt-20 border-b border-zinc-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-amber-700 uppercase">Inteligência & governança</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl sm:leading-tight">
              Muito além do cálculo: inteligência e previsibilidade para a sua operação.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Uma visão centralizada para controlar custos, auditar divergências de peso e entender a performance de cada transportadora parceira.
            </p>
            <a
              href="#para-sua-operacao"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 transition hover:text-amber-700"
            >
              Veja como a LogiFlow apoia sua operação
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-amber-300 hover:bg-amber-50/30">
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm ring-1 ring-zinc-200 group-hover:ring-amber-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight text-zinc-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
