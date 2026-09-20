'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  AlertCircle,
  Sparkles,
  Scale,
  Truck,
  ShieldCheck,
  History,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { SimulateFreightInput, SimulationResult } from '@/src/types';
import { freightService } from '@/src/services';
import { FreightSimulationForm } from './FreightSimulationForm';
import { FreightResultsList } from './FreightResultsList';

export function FreightSimulation() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulate = async (payload: SimulateFreightInput) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await freightService.simulate(payload);
      if (res.error) {
        setErrorMessage(res.error);
        setResults(null);
      } else if (res.data) {
        setResults(res.data);
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage(
        'Ocorreu uma instabilidade na conexão com o servidor. Verifique sua conexão e tente novamente.',
      );
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-red-50 p-4 text-red-900 ring-1 ring-red-200 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Não foi possível calcular o frete</h4>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 transition cursor-pointer"
            aria-label="Fechar erro"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shadow-xs">
              <Calculator className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Simulador de Frete
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Compare tabelas comerciais de todas as transportadoras ativas com cálculo de cubagem automático e auditoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/fretes/historico"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-950"
          >
            <History className="size-4 text-zinc-500" />
            <span>Ver Auditoria e Histórico</span>
          </Link>
        </div>
      </div>

      {/* Grid Principal: Formulário + (Resultados OU Painel Informativo) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Formulário de Simulação */}
        <div className={results ? 'lg:col-span-5' : 'lg:col-span-7'}>
          <FreightSimulationForm onSubmit={handleSimulate} isLoading={loading} />
        </div>

        {/* Coluna Direita: Resultados ou Guia Explicativo */}
        <div className={results ? 'lg:col-span-7' : 'lg:col-span-5'}>
          {results ? (
            <FreightResultsList result={results} onReset={handleReset} />
          ) : (
            <div className="space-y-4">
              {/* Card Explicativo de Regras Comerciais */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Sparkles className="size-4 text-amber-500" />
                  </span>
                  <h3 className="text-sm font-bold text-zinc-950">
                    Como funciona a Simulação LogiFlow?
                  </h3>
                </div>

                <div className="mt-4 space-y-3.5 text-xs text-zinc-600 leading-relaxed">
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] mt-0.5">
                      1
                    </div>
                    <div>
                      <strong className="block text-zinc-900 font-semibold">
                        Geolocalização e Roteamento
                      </strong>
                      O CEP é consultado na base nacional dos Correios/BrasilAPI para identificar automaticamente a cidade, o estado e a abrangência (Local, Estadual ou Interestadual).
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] mt-0.5">
                      2
                    </div>
                    <div>
                      <strong className="block text-zinc-900 font-semibold">
                        Fórmula de Cubagem Rodoviária (6.000 cm³/kg)
                      </strong>
                      Se o volume do pacote ocupar mais espaço na caçamba do que seu peso físico, a transportadora cobrará pelo peso cubado, otimizando o frete sem prejuízos.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] mt-0.5">
                      3
                    </div>
                    <div>
                      <strong className="block text-zinc-900 font-semibold">
                        Ranking Multi-Transportadora
                      </strong>
                      O sistema compara instantaneamente todas as transportadoras ativas e destaca a opção com o <em>Menor Custo</em> e a com o <em>Menor Prazo de Entrega</em>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] mt-0.5">
                      4
                    </div>
                    <div>
                      <strong className="block text-zinc-900 font-semibold">
                        Registro Automático de Auditoria
                      </strong>
                      Toda simulação gera um registro histórico auditado com os parâmetros informados, permitindo conferências futuras.
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Apoio ao Operador */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 mb-2">
                  <Truck className="size-4 text-zinc-400" />
                  <span>Dica operacional:</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Para mercadorias frágeis ou de alto valor, lembre-se de preencher o <strong>Valor Declarado</strong> para que a taxa de seguro (ad-valorem de 0,5%) seja inclusa na cotação final.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
