'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Box, Calculator, Clock, ShieldCheck, SlidersHorizontal, TrendingUp } from 'lucide-react';

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      id: 'regras',
      badge: 'Zero faturas surpresa',
      badgeIcon: ShieldCheck,
      title: 'Centralize regras e blinde sua margem de lucro',
      description:
        'Diga adeus a planilhas soltas e faturas divergentes no fim do mês. Parametrize suas transportadoras homologadas com regras claras de frete, peso e pedágio em um único hub. Tenha controle cirúrgico de cada centavo antes do despacho.',
      icon: SlidersHorizontal,
    },
    {
      id: 'cubagem',
      badge: 'Economize 45min por carga',
      badgeIcon: Clock,
      title: 'Cubagem e rota automáticas em milissegundos',
      description:
        'Esqueça calculadoras manuais e renegociações desgastantes por erro de cubagem. Nosso motor calcula instantaneamente o peso real vs. cubado e cruza a rota exata por CEP. Sua expedição pronta para liberar pedidos no tempo de um clique.',
      icon: Box,
    },
    {
      id: 'decisao',
      badge: 'Até 28% de economia no frete',
      badgeIcon: TrendingUp,
      title: 'A melhor decisão na mesa com 1 clique',
      description:
        'Compare todas as cotações em tempo real ordenadas pelo menor custo e melhor prazo. Escolha a transportadora mais vantajosa para o seu caixa com transparência total e histórico 100% auditável para garantir o mês no azul.',
      icon: Calculator,
    },
  ];

  return (
    <section id="como-funciona" className="scroll-mt-20 border-b border-zinc-200 bg-zinc-50/60 pt-12 pb-20 md:pt-16 md:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho com animação elegante */}
        <motion.div
          className="max-w-3xl"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm font-semibold tracking-[0.14em] text-amber-700 uppercase">
            Eficiência que protege o seu caixa
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
            Como o LogiFlow transforma sua logística em uma máquina de margem
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Cotações lentas em planilhas e fretes calculados no escuro custam caro todos os dias. Veja como o LogiFlow
            automatiza a decisão, elimina retrabalho e estanca prejuízos em 3 passos simples.
          </p>
        </motion.div>

        {/* Grade de 3 Cards com Animação em Cascata Nitidamente Visível */}
        <div className="relative mt-14">
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const BadgeIcon = step.badgeIcon;
              return (
                <motion.li
                  key={step.id}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 50, scale: 0.94 }
                  }
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: shouldReduceMotion ? 0 : 0.65,
                      delay: shouldReduceMotion ? 0 : index * 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                  viewport={{ once: false, amount: 0.25 }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                        y: -8,
                        scale: 1.015,
                        transition: { duration: 0.22, ease: 'easeOut' },
                      }
                  }
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/15"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <motion.span
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                        className="flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/90 transition-colors group-hover:bg-amber-100 group-hover:text-amber-800 group-hover:ring-amber-300 shadow-sm"
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </motion.span>
                    </div>

                    <div className="mt-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-900 shadow-xs transition-colors group-hover:border-amber-300 group-hover:bg-amber-100">
                        <BadgeIcon className="size-3.5 text-amber-600" aria-hidden="true" />
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-amber-950">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{step.description}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-end border-t border-zinc-100 pt-4 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 transition-transform group-hover:translate-x-1">
                      <span>Fluxo automatizado</span>
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
