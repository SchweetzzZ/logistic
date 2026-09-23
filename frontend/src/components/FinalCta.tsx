'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Check, ArrowRight, Sparkles, Zap } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function FinalCta() {
  const shouldReduceMotion = useReducedMotion();

  const monthlyFeatures = [
    'Cubagem automática ilimitada',
    'Cálculo de rotas e cotações em ms',
    'Transportadoras homologadas ilimitadas',
    'Múltiplos operadores e perfis',
    'Histórico auditável de cotações',
  ];

  const annualFeatures = [
    'Tudo incluso no plano mensal',
    '2 meses grátis (economia de 20%)',
    'Suporte prioritário via WhatsApp',
    'Onboarding guiado com especialista',
    'Relatórios executivos e auditoria',
  ];

  return (
    <section
      id="planos"
      className="scroll-mt-20 border-b border-zinc-200 bg-zinc-50/50 py-14 md:py-20 relative overflow-hidden"
    >
      {/* Luz ambiente de fundo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-100/50 via-zinc-100/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da seção */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-0.5 text-xs font-semibold tracking-wide text-amber-800 uppercase">
            <Sparkles className="size-3 text-amber-600" aria-hidden="true" />
            Planos e Assinatura
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl md:text-4xl">
            Previsibilidade e economia para sua operação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
            14 dias de teste gratuito, sem cartão de crédito. Cancele ou alterne quando quiser.
          </p>
        </motion.div>

        {/* Grade com os 2 Cards de Preço compactos */}
        <motion.div
          className="mx-auto mt-9 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch"
          variants={containerVariants}
          initial={shouldReduceMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {/* CARD 1: PLANO MENSAL */}
          <motion.div
            variants={cardVariants}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg sm:p-7"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                  Sem fidelidade
                </span>
                <span className="text-[11px] font-medium text-zinc-400">Flexibilidade total</span>
              </div>

              <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">
                Plano Mensal
              </h3>
              <p className="mt-1 text-xs text-zinc-500 leading-normal">
                Autonomia imediata para cotar e auditar fretes sem contrato longo.
              </p>

              {/* Bloco de Preço */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                  R$ 197
                </span>
                <span className="text-xs font-medium text-zinc-500">/mês</span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Cobrança mensal recorrente • Cancele quando quiser
              </p>

              {/* Destaque do trial */}
              <div className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/70 py-1.5 text-xs font-medium text-amber-900">
                <Zap className="size-3 text-amber-600" aria-hidden="true" />
                14 dias grátis sem cartão de crédito
              </div>

              {/* Divisor */}
              <div className="my-4 border-t border-zinc-100" />

              {/* Lista de Recursos */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  O que está incluso:
                </p>
                <ul className="space-y-2 text-xs text-zinc-600">
                  {monthlyFeatures.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <div className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ações do Card Mensal */}
            <div className="mt-6 pt-4 border-t border-zinc-100">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Começar teste de 14 dias grátis
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="mt-2 block text-center text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition"
              >
                Já é cliente? Acessar sistema
              </Link>
            </div>
          </motion.div>

          {/* CARD 2: PLANO ANUAL */}
          <motion.div
            variants={cardVariants}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col justify-between rounded-2xl border-2 border-amber-500 bg-zinc-950 p-6 text-white shadow-xl shadow-amber-500/10 sm:p-7"
          >
            {/* Badge visual em destaque no topo */}
            <div className="absolute -top-3 right-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-sm">
                <Sparkles className="size-3 text-zinc-950" aria-hidden="true" />
                Mais vantajoso — Economize 20%
              </span>
            </div>

            {/* Brilho radial interno */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-2xl bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  2 meses grátis
                </span>
                <span className="text-[11px] font-medium text-amber-400">Economia de R$ 480/ano</span>
              </div>

              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
                Plano Anual
              </h3>
              <p className="mt-1 text-xs text-zinc-300 leading-normal">
                Máxima rentabilidade e suporte prioritário para operações ativas.
              </p>

              {/* Bloco de Preço */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-amber-400 sm:text-4xl">
                  R$ 157
                </span>
                <span className="text-xs font-medium text-zinc-400">/mês equiv.</span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Faturado anualmente (R$ 1.884/ano) • Economize 20%
              </p>

              {/* Destaque do trial */}
              <div className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-xs font-medium text-amber-300">
                <Zap className="size-3 text-amber-400" aria-hidden="true" />
                14 dias grátis sem cartão de crédito
              </div>

              {/* Divisor */}
              <div className="my-4 border-t border-zinc-800" />

              {/* Lista de Recursos */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
                  Tudo do Mensal e mais:
                </p>
                <ul className="space-y-2 text-xs text-zinc-200">
                  {annualFeatures.map((feat, index) => {
                    const isExtra = index > 0;
                    return (
                      <li key={feat} className="flex items-center gap-2">
                        <div
                          className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${isExtra
                              ? 'bg-amber-400 text-zinc-950 font-bold'
                              : 'bg-amber-500/20 text-amber-400'
                            }`}
                        >
                          <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                        </div>
                        <span className={isExtra ? 'font-medium text-amber-100' : 'text-zinc-300'}>
                          {feat}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Ações do Card Anual */}
            <div className="relative z-10 mt-6 pt-4 border-t border-zinc-800">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-amber-400/20 transition hover:bg-amber-300"
              >
                Começar teste de 14 dias grátis
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="mt-2 block text-center text-[11px] font-medium text-zinc-400 hover:text-white transition"
              >
                Já é cliente? Acessar sistema
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
