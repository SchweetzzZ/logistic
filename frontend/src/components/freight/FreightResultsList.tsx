'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ArrowRight,
  Package,
  History,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SimulationResult } from '@/src/types';
import { FreightQuoteCard } from './FreightQuoteCard';

export interface FreightResultsListProps {
  result: SimulationResult;
  onReset?: () => void;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function FreightResultsList({ result, onReset }: FreightResultsListProps) {
  const { origin, destination, quotes, package: pkg } = result;

  return (
    <div className="space-y-6">
      {/* Route & Encomenda Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Resultado da Cotação
            </span>
            <h2 className="text-lg font-bold text-zinc-950">
              Comparativo de Transportadoras
            </h2>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition cursor-pointer"
              title="Limpar e realizar nova simulação"
            >
              <RotateCcw className="size-3.5" />
              <span>Nova</span>
            </button>
          )}
        </div>

        {/* Route Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-11 items-center gap-3 bg-zinc-50/70 p-4 rounded-xl border border-zinc-100">
          {/* Origem */}
          <div className="sm:col-span-5 flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700">
              <MapPin className="size-4" />
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Origem (Expedição)
              </span>
              <p className="text-sm font-bold text-zinc-900">
                {origin.city} - {origin.state}
              </p>
              <span className="text-xs text-zinc-500">CEP {formatCEP(origin.zipCode)}</span>
            </div>
          </div>

          {/* Seta */}
          <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-900">
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Destino */}
          <div className="sm:col-span-5 flex items-start gap-3 sm:justify-end sm:text-right">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Destino (Entrega)
              </span>
              <p className="text-sm font-bold text-zinc-900">
                {destination.city} - {destination.state}
              </p>
              <span className="text-xs text-zinc-500">
                CEP {formatCEP(destination.zipCode)}
              </span>
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 sm:order-last">
              <MapPin className="size-4" />
            </div>
          </div>
        </div>

        {/* Package Specifications Pill */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 bg-zinc-50/50 px-3 py-2 rounded-xl border border-zinc-100">
          <div className="flex items-center gap-1.5">
            <Package className="size-4 text-zinc-400" />
            <span>Dimensões:</span>
            <strong className="text-zinc-900">
              {pkg.dimensions.length} × {pkg.dimensions.width} × {pkg.dimensions.height} cm
            </strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Peso Cobrado:</span>
            <span className="rounded-md bg-amber-100/80 px-2 py-0.5 font-bold text-zinc-950">
              {pkg.chargedWeightKg} kg
            </span>
            <span className="text-[11px] text-zinc-400">
              (Real: {pkg.actualWeightKg}kg / Cubado: {pkg.volumetricWeightKg}kg)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Valor Declarado:</span>
            <strong className="text-zinc-900">{formatBRL(pkg.declaredValue)}</strong>
          </div>
        </div>
      </div>

      {/* Action Banner to History */}
      <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600 shrink-0" />
          <span>
            Esta cotação foi registrada com sucesso no registro de auditoria do sistema.
          </span>
        </div>
        <Link
          href="/fretes/historico"
          className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline hover:no-underline transition shrink-0 ml-2"
        >
          <History className="size-3.5" />
          <span>Ver no Histórico</span>
        </Link>
      </div>

      {/* Quotes Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-950">
            {quotes.length === 1
              ? 'Resultado da Cotação'
              : `${quotes.length} Opções Disponíveis`}
          </h3>
          <p className="text-xs text-zinc-500">
            {quotes.length === 1
              ? 'Condição calculada para a transportadora selecionada'
              : 'Transportadoras ativas ordenadas pela melhor condição comercial'}
          </p>
        </div>
      </div>

      {/* Quotes Cards Grid/List */}
      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Truck className="size-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-zinc-900">
            Nenhuma transportadora ativa encontrada
          </h4>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            Não há transportadoras ativas configuradas no tenant para atender esta rota no momento.
          </p>
          <div className="mt-4">
            <Link
              href="/transportadoras"
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              <Truck className="size-3.5 text-amber-400" />
              <span>Gerenciar Transportadoras</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quotes.map((quote) => (
            <FreightQuoteCard
              key={quote.carrierId}
              quote={quote}
              routeInfo={{
                originCity: origin.city,
                originState: origin.state,
                destinationCity: destination.city,
                destinationState: destination.state,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
