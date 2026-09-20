'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  RotateCcw,
  Scale,
  ShieldCheck,
  Trophy,
  Truck,
  X,
} from 'lucide-react';
import type { FreightHistoryItem, FreightQuote } from '@/src/types';

export interface FreightHistoryDetailModalProps {
  isOpen: boolean;
  item: FreightHistoryItem | null;
  onClose: () => void;
}

export function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return 'R$ 0,00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatNumber(val: number | string | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatZipCode(zip?: string | null): string {
  if (!zip) return '-';
  const digits = zip.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return zip;
}

export function getDeliveryTypeBadge(type: 'LOCAL' | 'STATE' | 'INTERSTATE') {
  switch (type) {
    case 'LOCAL':
      return {
        label: 'Entrega Local',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
        dotClass: 'bg-emerald-500',
      };
    case 'STATE':
      return {
        label: 'Estadual',
        className: 'bg-blue-50 text-blue-700 ring-blue-200/80',
        dotClass: 'bg-blue-500',
      };
    case 'INTERSTATE':
      return {
        label: 'Interestadual',
        className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
        dotClass: 'bg-amber-500',
      };
    default:
      return {
        label: type,
        className: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
        dotClass: 'bg-zinc-400',
      };
  }
}

export function FreightHistoryDetailModal({
  isOpen,
  item,
  onClose,
}: FreightHistoryDetailModalProps) {
  const router = useRouter();

  if (!isOpen || !item) return null;

  const actualWeight = parseFloat(item.actualWeightKg) || 0;
  const volumetricWeight = parseFloat(item.volumetricWeightKg) || 0;
  const chargedWeight = parseFloat(item.chargedWeightKg) || 0;
  const isCubageApplied = volumetricWeight > actualWeight;

  const deliveryTypeBadge = getDeliveryTypeBadge(item.deliveryType);
  const quotesList: FreightQuote[] = Array.isArray(item.quotes) ? item.quotes : [];

  const handleRepeatSimulation = () => {
    const params = new URLSearchParams({
      destinationZipCode: item.destinationZipCode,
      weight: item.actualWeightKg,
      length: item.dimensionsLength,
      width: item.dimensionsWidth,
      height: item.dimensionsHeight,
      declaredValue: item.declaredValue,
    });

    if (item.originZipCode) {
      params.set('originZipCode', item.originZipCode);
    }

    router.push(`/fretes/simular?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                  Auditoria de Simulação de Frete
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${deliveryTypeBadge.className}`}
                >
                  <span className={`size-1.5 rounded-full ${deliveryTypeBadge.dotClass}`} />
                  {deliveryTypeBadge.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5 text-zinc-400" />
                  {formatDateTime(item.createdAt)}
                </span>
                <span>•</span>
                <span className="font-mono text-zinc-400">
                  ID: #{item.id.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Rota e Localidades */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-amber-600" />
              Trajeto da Rota Auditada
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Origem */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Origem
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-700">
                    CEP {formatZipCode(item.originZipCode)}
                  </span>
                </div>
                <p className="mt-2 text-base font-bold text-zinc-950">
                  {item.originCity || 'Origem Padrão'}
                  {item.originState ? `, ${item.originState}` : ''}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Centro de Distribuição / Remetente</p>
              </div>

              {/* Destino */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Destino
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-700">
                    CEP {formatZipCode(item.destinationZipCode)}
                  </span>
                </div>
                <p className="mt-2 text-base font-bold text-zinc-950">
                  {item.destinationCity || 'Cidade de Destino'}
                  {item.destinationState ? `, ${item.destinationState}` : ''}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Local de Entrega Final</p>
              </div>
            </div>
          </div>

          {/* Dados da Carga e Auditoria de Cubagem */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Box className="size-4 text-amber-600" />
              Especificações da Carga e Pesagem
            </h3>

            {isCubageApplied && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Regra de Cubagem Aplicada</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    O peso volumétrico apurado ({formatNumber(volumetricWeight)} kg) superou o peso físico real ({formatNumber(actualWeight)} kg). Conforme as diretrizes das transportadoras, o cálculo tarifário utilizou o peso cobrado de {formatNumber(chargedWeight)} kg.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/75 p-3.5">
                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                  <Scale className="size-3.5 text-zinc-400" />
                  Peso Físico Real
                </span>
                <p className="mt-1.5 text-lg font-bold text-zinc-950">
                  {formatNumber(actualWeight)} <span className="text-xs font-normal text-zinc-500">kg</span>
                </p>
              </div>

              <div className={`rounded-xl border p-3.5 ${
                isCubageApplied
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-zinc-100 bg-zinc-50/75'
              }`}>
                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                  <Box className="size-3.5 text-zinc-400" />
                  Peso Volumétrico
                </span>
                <p className={`mt-1.5 text-lg font-bold ${isCubageApplied ? 'text-amber-900' : 'text-zinc-950'}`}>
                  {formatNumber(volumetricWeight)} <span className="text-xs font-normal text-zinc-500">kg</span>
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
                <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Peso Faturado (Cobrado)
                </span>
                <p className="mt-1.5 text-lg font-bold text-emerald-900">
                  {formatNumber(chargedWeight)} <span className="text-xs font-normal text-emerald-700">kg</span>
                </p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/75 p-3.5">
                <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-zinc-400" />
                  Valor Declarado
                </span>
                <p className="mt-1.5 text-lg font-bold text-zinc-950">
                  {formatCurrency(item.declaredValue)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5 text-xs text-zinc-600 border border-zinc-100">
              <span className="font-medium text-zinc-500">Dimensões da Embalagem:</span>
              <span className="font-semibold text-zinc-900">
                {item.dimensionsLength} cm (C) × {item.dimensionsWidth} cm (L) × {item.dimensionsHeight} cm (A)
              </span>
            </div>
          </div>

          {/* Cotações Comparadas Snapshot */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Truck className="size-4 text-amber-600" />
                Cotações Auditadas ({quotesList.length})
              </h3>
              {item.cheapestCarrierName && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg ring-1 ring-emerald-200">
                  <Trophy className="size-3.5 text-emerald-600" />
                  Vencedora: {item.cheapestCarrierName}
                </span>
              )}
            </div>

            {quotesList.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
                Nenhum detalhe adicional de cotações registrado para esta simulação.
              </div>
            ) : (
              <div className="space-y-3">
                {quotesList.map((quote, idx) => {
                  const isWinner =
                    (item.cheapestCarrierId && quote.carrierId === item.cheapestCarrierId) ||
                    (!item.cheapestCarrierId && idx === 0);

                  return (
                    <div
                      key={quote.carrierId || idx}
                      className={`rounded-2xl border p-4 transition shadow-xs ${
                        isWinner
                          ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200/70'
                          : 'border-zinc-200/80 bg-white'
                      }`}
                    >
                      {/* Quote header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              isWinner
                                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <Truck className="size-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-zinc-950">
                                {quote.carrierName}
                              </h4>
                              {isWinner && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Trophy className="size-3 text-emerald-700" />
                                  Melhor Preço
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="size-3 text-zinc-400" />
                              Prazo de entrega:{' '}
                              <strong className="text-zinc-700 font-semibold">
                                {quote.deadlineDays} {quote.deadlineDays === 1 ? 'dia útil' : 'dias úteis'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-right sm:self-center">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">
                            Valor Final
                          </span>
                          <span className={`text-xl font-black ${isWinner ? 'text-emerald-700' : 'text-zinc-950'}`}>
                            {formatCurrency(quote.totalPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Quote Breakdown */}
                      {quote.breakdown && (
                        <div className="mt-3 pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                            Detalhamento de Custos Auditado
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                              <span className="text-[11px] text-zinc-500 block">Tarifa Base</span>
                              <span className="font-semibold text-zinc-900">
                                {formatCurrency(quote.breakdown.basePrice)}
                              </span>
                            </div>

                            <div className="rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                              <span className="text-[11px] text-zinc-500 block">Custo por Peso</span>
                              <span className="font-semibold text-zinc-900">
                                {formatCurrency(quote.breakdown.weightCost)}
                              </span>
                              <span className="block text-[10px] text-zinc-400">
                                {quote.breakdown.chargedWeightKg} kg × {formatCurrency(quote.breakdown.pricePerKg)}
                              </span>
                            </div>

                            <div className="rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                              <span className="text-[11px] text-zinc-500 block">Fator Distância</span>
                              <span className="font-semibold text-zinc-900">
                                {quote.breakdown.distanceMultiplier}x
                              </span>
                              <span className="block text-[10px] text-zinc-400">
                                Subtotal: {formatCurrency(quote.breakdown.shippingSubtotal)}
                              </span>
                            </div>

                            <div className="rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                              <span className="text-[11px] text-zinc-500 block">Seguro de Carga</span>
                              <span className="font-semibold text-zinc-900">
                                {formatCurrency(quote.breakdown.insuranceCost)}
                              </span>
                              <span className="block text-[10px] text-zinc-400">
                                0.3% s/ valor decl.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleRepeatSimulation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
          >
            <RotateCcw className="size-4 text-amber-400" />
            <span>Repetir Simulação</span>
          </button>
        </div>
      </div>
    </div>
  );
}
