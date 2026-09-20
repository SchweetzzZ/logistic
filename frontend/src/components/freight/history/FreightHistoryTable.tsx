'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Calendar,
  Clock,
  Eye,
  RotateCcw,
  Scale,
  Trophy,
  Truck,
} from 'lucide-react';
import type { FreightHistoryItem } from '@/src/types';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatZipCode,
  getDeliveryTypeBadge,
} from './FreightHistoryDetailModal';

export interface FreightHistoryTableProps {
  items: FreightHistoryItem[];
  onSelectDetail: (item: FreightHistoryItem) => void;
  onRepeatSimulation: (item: FreightHistoryItem) => void;
}

export function FreightHistoryTable({
  items,
  onSelectDetail,
  onRepeatSimulation,
}: FreightHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3.5">Data / Hora</th>
              <th className="px-5 py-3.5">Rota</th>
              <th className="px-5 py-3.5">Carga & Pesagem</th>
              <th className="px-5 py-3.5">Vencedora (Mais Barata)</th>
              <th className="px-5 py-3.5 text-center">Cotações</th>
              <th className="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => {
              const actualWeight = parseFloat(item.actualWeightKg) || 0;
              const volumetricWeight = parseFloat(item.volumetricWeightKg) || 0;
              const chargedWeight = parseFloat(item.chargedWeightKg) || 0;
              const isCubage = volumetricWeight > actualWeight;
              const deliveryBadge = getDeliveryTypeBadge(item.deliveryType);
              const quotesCount = Array.isArray(item.quotes) ? item.quotes.length : 0;

              return (
                <tr
                  key={item.id}
                  className="group hover:bg-zinc-50/80 transition-colors"
                >
                  {/* Data / Hora */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <div className="flex items-start gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900">
                          {formatDateTime(item.createdAt)}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                          #{item.id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rota */}
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                      <span>
                        {item.originCity || 'Origem'}
                        {item.originState ? `/${item.originState}` : ''}
                      </span>
                      <ArrowRight className="size-3.5 text-zinc-400 shrink-0" />
                      <span>
                        {item.destinationCity || 'Destino'}
                        {item.destinationState ? `/${item.destinationState}` : ''}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${deliveryBadge.className}`}
                      >
                        <span className={`size-1.5 rounded-full ${deliveryBadge.dotClass}`} />
                        {deliveryBadge.label}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Destino: {formatZipCode(item.destinationZipCode)}
                      </span>
                    </div>
                  </td>

                  {/* Carga & Pesagem */}
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                        <Scale className="size-3.5 text-zinc-400 shrink-0" />
                        <span>
                          Físico: <strong>{formatNumber(actualWeight)} kg</strong>
                        </span>
                        {isCubage ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300">
                            <AlertTriangle className="size-2.5 text-amber-600" />
                            Cubado: {formatNumber(chargedWeight)} kg
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">(Cobrado: {formatNumber(chargedWeight)} kg)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <Box className="size-3 text-zinc-400 shrink-0" />
                        <span>
                          {item.dimensionsLength} × {item.dimensionsWidth} × {item.dimensionsHeight} cm
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        Valor decl.: {formatCurrency(item.declaredValue)}
                      </div>
                    </div>
                  </td>

                  {/* Vencedora (Mais Barata) */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    {item.cheapestCarrierName ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="size-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-zinc-900">
                            {item.cheapestCarrierName}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-emerald-700">
                          {formatCurrency(item.cheapestPrice)}
                        </div>
                        {item.cheapestDeadlineDays !== null && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="size-3 text-zinc-400" />
                            <span>
                              {item.cheapestDeadlineDays}{' '}
                              {item.cheapestDeadlineDays === 1 ? 'dia útil' : 'dias úteis'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">
                        Sem cotação
                      </span>
                    )}
                  </td>

                  {/* Cotações Geradas */}
                  <td className="px-5 py-4 align-top text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      <Truck className="size-3 text-zinc-400" />
                      {quotesCount} {quotesCount === 1 ? 'opção' : 'opções'}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 transition cursor-pointer"
                        title="Ver auditoria e detalhes completos"
                      >
                        <Eye className="size-3.5 text-zinc-500" />
                        <span>Detalhes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRepeatSimulation(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition cursor-pointer"
                        title="Repetir simulação com os mesmos dados"
                      >
                        <RotateCcw className="size-3.5 text-amber-400" />
                        <span>Repetir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
