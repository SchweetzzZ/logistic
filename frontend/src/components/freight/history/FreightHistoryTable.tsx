'use client';

import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { FreightHistoryItem } from '@/src/types';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatZipCode,
} from './FreightHistoryDetailModal';

export interface FreightHistoryPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  startRecord: number;
  endRecord: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export interface FreightHistoryTableProps {
  items: FreightHistoryItem[];
  onSelectDetail: (item: FreightHistoryItem) => void;
  onRepeatSimulation: (item: FreightHistoryItem) => void;
  pagination?: FreightHistoryPaginationProps;
}

function getDeliveryTypeLabel(type: 'LOCAL' | 'STATE' | 'INTERSTATE') {
  switch (type) {
    case 'LOCAL':
      return 'Entrega Local';
    case 'STATE':
      return 'Estadual';
    case 'INTERSTATE':
      return 'Interestadual';
    default:
      return type;
  }
}

export function FreightHistoryTable({
  items,
  onSelectDetail,
  onRepeatSimulation,
  pagination,
}: FreightHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3.5">Data / Hora</th>
              <th className="px-5 py-3.5">Rota</th>
              <th className="px-5 py-3.5">Carga</th>
              <th className="px-5 py-3.5">Melhor Opção</th>
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
              const quotesCount = Array.isArray(item.quotes) ? item.quotes.length : 0;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectDetail(item)}
                  className="group hover:bg-zinc-50/70 transition-colors cursor-pointer"
                >
                  {/* Data / Hora */}
                  <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                    <div className="text-xs font-medium text-zinc-900">
                      {formatDateTime(item.createdAt)}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                      #{item.id.slice(-6)}
                    </div>
                  </td>

                  {/* Rota */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-900">
                      <span>
                        {item.originCity || 'Origem'}
                        {item.originState ? `/${item.originState}` : ''}
                      </span>
                      <ArrowRight className="size-3 text-zinc-400 shrink-0" />
                      <span>
                        {item.destinationCity || 'Destino'}
                        {item.destinationState ? `/${item.destinationState}` : ''}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span>CEP {formatZipCode(item.destinationZipCode)}</span>
                      <span>•</span>
                      <span className="text-zinc-500">
                        {getDeliveryTypeLabel(item.deliveryType)}
                      </span>
                    </div>
                  </td>

                  {/* Carga & Pesagem */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="text-xs font-medium text-zinc-900">
                      {formatNumber(chargedWeight)} kg
                      {isCubage && (
                        <span className="ml-1.5 text-[11px] font-normal text-zinc-500">
                          (cubado)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {item.dimensionsLength} × {item.dimensionsWidth} × {item.dimensionsHeight} cm
                    </div>
                  </td>

                  {/* Vencedora (Mais Barata) */}
                  <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                    {item.cheapestCarrierName ? (
                      <div>
                        <div className="text-xs font-medium text-zinc-900">
                          {item.cheapestCarrierName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-semibold text-zinc-900">
                            {formatCurrency(item.cheapestPrice)}
                          </span>
                          {item.cheapestDeadlineDays !== null && (
                            <span className="text-zinc-400">
                              • {item.cheapestDeadlineDays}{' '}
                              {item.cheapestDeadlineDays === 1 ? 'dia útil' : 'dias úteis'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Sem cotação</span>
                    )}
                  </td>

                  {/* Cotações Geradas */}
                  <td className="px-5 py-3.5 align-middle text-center whitespace-nowrap">
                    <span className="text-xs text-zinc-600">
                      {quotesCount} {quotesCount === 1 ? 'opção' : 'opções'}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRepeatSimulation(item);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition cursor-pointer"
                        title="Repetir simulação com os mesmos dados"
                      >
                        <RotateCcw className="size-3 text-zinc-400" />
                        <span>Repetir</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDetail(item);
                        }}
                        className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition cursor-pointer"
                        title="Ver auditoria e detalhes completos"
                      >
                        <span>Detalhes</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé de Paginação Integrado */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-200/80 bg-zinc-50/50 px-5 py-3 text-xs text-zinc-500">
          <div>
            Mostrando <span className="font-semibold text-zinc-800">{pagination.startRecord}</span> até{' '}
            <span className="font-semibold text-zinc-800">{pagination.endRecord}</span> de{' '}
            <span className="font-semibold text-zinc-800">{pagination.total}</span> registros auditados
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                pagination.onPageChange(Math.max(1, pagination.page - 1));
              }}
              disabled={pagination.page <= 1 || pagination.loading}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5" />
              <span>Anterior</span>
            </button>

            <span className="px-2 text-xs font-medium text-zinc-700">
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1));
              }}
              disabled={pagination.page >= pagination.totalPages || pagination.loading}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Próxima</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
