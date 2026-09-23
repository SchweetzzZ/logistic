'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calculator,
  Calendar,
  History,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { freightService } from '@/src/services/freight';
import type { FreightHistoryItem } from '@/src/types';
import { FreightHistoryTable } from './FreightHistoryTable';
import { FreightHistoryDetailModal } from './FreightHistoryDetailModal';

export function FreightHistoryManagement() {
  const router = useRouter();

  // Dados paginados da API
  const [items, setItems] = useState<FreightHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros locais de visualização
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<
    'ALL' | 'LOCAL' | 'STATE' | 'INTERSTATE'
  >('ALL');

  // Modal de auditoria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FreightHistoryItem | null>(null);

  const loadHistory = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await freightService.getHistory(targetPage, limit);
      setItems(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError('Falha ao carregar histórico auditado de fretes.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadHistory(page);
  }, [loadHistory, page]);

  // Ações
  const handleOpenDetail = (item: FreightHistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleRepeatSimulation = (item: FreightHistoryItem) => {
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

  // Filtragem local dos registros da página atual
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/\D/g, '');

    const matchSearch =
      !q ||
      (item.originCity?.toLowerCase().includes(q) ?? false) ||
      (item.originState?.toLowerCase().includes(q) ?? false) ||
      (item.destinationCity?.toLowerCase().includes(q) ?? false) ||
      (item.destinationState?.toLowerCase().includes(q) ?? false) ||
      (item.cheapestCarrierName?.toLowerCase().includes(q) ?? false) ||
      (cleanDigits.length > 0 && item.originZipCode.includes(cleanDigits)) ||
      (cleanDigits.length > 0 && item.destinationZipCode.includes(cleanDigits)) ||
      (item.quotes?.some((quote) => quote.carrierName.toLowerCase().includes(q)) ?? false);

    const matchDeliveryType =
      deliveryTypeFilter === 'ALL' || item.deliveryType === deliveryTypeFilter;

    return matchSearch && matchDeliveryType;
  });

  // Métricas calculadas
  const validCheapestPrices = items
    .map((i) => (i.cheapestPrice ? parseFloat(i.cheapestPrice) : null))
    .filter((p): p is number => p !== null && !isNaN(p));

  const avgCheapestPrice =
    validCheapestPrices.length > 0
      ? validCheapestPrices.reduce((acc, curr) => acc + curr, 0) /
        validCheapestPrices.length
      : 0;

  const formattedAvgPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(avgCheapestPrice);

  const totalQuotesEvaluated = items.reduce(
    (acc, curr) => acc + (Array.isArray(curr.quotes) ? curr.quotes.length : 0),
    0,
  );
  const avgQuotesPerSim = items.length > 0 ? (totalQuotesEvaluated / items.length).toFixed(1) : '0';

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      {/* Notificação de Erro */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => loadHistory(page)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-50 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <History className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Histórico & Auditoria de Fretes
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Registro auditável de todas as simulações, cubagens, rotas e tabelas de frete consultadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadHistory(page)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
            title="Recarregar registros"
          >
            <RefreshCw className={`size-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <Link
            href="/fretes/simular"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 cursor-pointer"
          >
            <Calculator className="size-4 text-amber-400" />
            <span>Nova Simulação</span>
          </Link>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total de Simulações */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total de Simulações</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-950">{total}</p>
          <span className="text-[11px] text-zinc-400">Total histórico registrado</span>
        </div>

        {/* Cotação Média / Frete */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Cotação Média / Frete</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Calculator className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formattedAvgPrice}</p>
          <span className="text-[11px] text-zinc-400">Menor valor médio por simulação</span>
        </div>

        {/* Média de Parceiras / Simulação */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Média de Parceiras / Simulação</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Truck className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{avgQuotesPerSim}</p>
          <span className="text-[11px] text-zinc-400">Opções comparadas em média</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cidade, UF, transportadora ou CEP..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-4 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filtro por Tipo de Entrega */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <Layers className="size-3.5 text-zinc-400" />
            Tipo:
          </span>
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-medium">
            <button
              onClick={() => setDeliveryTypeFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                deliveryTypeFilter === 'ALL'
                  ? 'bg-white font-bold text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setDeliveryTypeFilter('LOCAL')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                deliveryTypeFilter === 'LOCAL'
                  ? 'bg-white font-bold text-emerald-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setDeliveryTypeFilter('STATE')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                deliveryTypeFilter === 'STATE'
                  ? 'bg-white font-bold text-blue-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Estadual
            </button>
            <button
              onClick={() => setDeliveryTypeFilter('INTERSTATE')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                deliveryTypeFilter === 'INTERSTATE'
                  ? 'bg-white font-bold text-amber-800 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Interestadual
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Tabela / Skeleton / Empty State */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 rounded-md bg-zinc-200 animate-pulse" />
              <div className="h-5 w-24 rounded-md bg-zinc-100 animate-pulse" />
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="py-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="size-9 rounded-xl bg-zinc-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-44 rounded-md bg-zinc-200" />
                      <div className="h-3 w-28 rounded-md bg-zinc-100" />
                    </div>
                  </div>
                  <div className="space-y-2 hidden sm:block">
                    <div className="h-4 w-36 rounded-md bg-zinc-200" />
                    <div className="h-3 w-20 rounded-md bg-zinc-100" />
                  </div>
                  <div className="h-6 w-24 rounded-md bg-zinc-200" />
                  <div className="h-8 w-20 rounded-xl bg-zinc-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 mb-4">
            <History className="size-8" />
          </div>

          <h3 className="text-base font-bold text-zinc-950">
            {searchQuery || deliveryTypeFilter !== 'ALL'
              ? 'Nenhuma simulação encontrada'
              : 'Nenhuma simulação de frete realizada ainda'}
          </h3>

          <p className="mt-1.5 max-w-md mx-auto text-xs text-zinc-500 leading-relaxed">
            {searchQuery || deliveryTypeFilter !== 'ALL'
              ? 'Não encontramos nenhum registro correspondente aos filtros de pesquisa selecionados.'
              : 'Todas as cotações calculadas na plataforma são auditadas automaticamente com snapshot das taxas, cubagem e transportadoras participantes.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery || deliveryTypeFilter !== 'ALL' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDeliveryTypeFilter('ALL');
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition cursor-pointer"
              >
                Limpar Filtros
              </button>
            ) : (
              <Link
                href="/fretes/simular"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
              >
                <Calculator className="size-4 text-amber-400" />
                <span>Simular Primeiro Frete</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <FreightHistoryTable
          items={filteredItems}
          onSelectDetail={handleOpenDetail}
          onRepeatSimulation={handleRepeatSimulation}
          pagination={
            !loading && total > 0
              ? {
                  page,
                  totalPages,
                  total,
                  startRecord,
                  endRecord,
                  onPageChange: (newPage) => setPage(newPage),
                  loading,
                }
              : undefined
          }
        />
      )}

      {/* Modal de Detalhes da Auditoria */}
      <FreightHistoryDetailModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
