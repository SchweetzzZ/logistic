'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Database, Eye, Filter, Globe, KeyRound, RefreshCw, Search, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { auditService } from '@/src/services/audit';
import type { AuditAction, AuditLogItem } from '@/src/types';
import { AuditDetailModal, formatDateTime, getActionBadge } from './AuditDetailModal';

export type ActionFilterCategory =
  | 'ALL'
  | 'LOGINS'
  | 'CREATES'
  | 'UPDATES'
  | 'DELETES';

export function AuditManagement() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros locais de visualização
  const [searchQuery, setSearchQuery] = useState('');
  const [actionCategory, setActionCategory] = useState<ActionFilterCategory>('ALL');

  // Modal de Detalhes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadAuditLogs = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        setError(null);

        const res = await auditService.list({
          page: targetPage,
          limit,
        });

        setItems(res.data || []);
        setTotal(res.total || 0);
        setPage(res.page || targetPage);
        setTotalPages(res.totalPages || 1);
      } catch {
        setError('Falha ao conectar com o serviço de auditoria do sistema.');
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    loadAuditLogs(page);
  }, [loadAuditLogs, page]);

  const handleOpenDetail = (item: AuditLogItem) => {
    setSelectedLog(item);
    setIsModalOpen(true);
  };

  // Filtragem local
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (item.userName?.toLowerCase().includes(q) ?? false) ||
      (item.userEmail?.toLowerCase().includes(q) ?? false) ||
      (item.resource?.toLowerCase().includes(q) ?? false) ||
      (item.resourceId?.toLowerCase().includes(q) ?? false) ||
      (item.ipAddress?.toLowerCase().includes(q) ?? false);

    let matchAction = true;
    if (actionCategory === 'LOGINS') {
      matchAction = item.action.startsWith('AUTH_');
    } else if (actionCategory === 'CREATES') {
      matchAction = item.action.endsWith('_CREATE');
    } else if (actionCategory === 'UPDATES') {
      matchAction =
        item.action.endsWith('_UPDATE') || item.action === 'USER_ROLE_CHANGE';
    } else if (actionCategory === 'DELETES') {
      matchAction = item.action.endsWith('_DELETE');
    }

    return matchSearch && matchAction;
  });

  // Métricas rápidas baseadas nos dados
  const authEventsCount = items.filter((i) => i.action.startsWith('AUTH_')).length;
  const dataMutationsCount = items.filter((i) => !i.action.startsWith('AUTH_')).length;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      {/* Alerta de Falha de Rede */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => loadAuditLogs(page)}
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
              <ShieldCheck className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Auditoria do Sistema
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Rastreamento seguro de logins, alterações cadastrais, operações de frete e mutações de dados corporativos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadAuditLogs(page)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
            title="Recarregar registros"
          >
            <RefreshCw className={`size-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas no Topo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total de registros */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total de Registros</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-950">{total}</p>
          <span className="mt-1 block text-xs text-zinc-400">Eventos auditados registrados</span>
        </div>

        {/* Eventos de autenticação */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Eventos de Autenticação</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/70">
              <KeyRound className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-blue-700">
            {authEventsCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">Logins e acessos na página atual</span>
        </div>

        {/* Mutações de dados */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Mutações de Dados</span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
              <Database className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-700">
            {dataMutationsCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-400">Criações, edições e exclusões</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
        {/* Barra de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuário, email, recurso ou IP..."
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

        {/* Dropdown de Filtro de Ação */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <Filter className="size-3.5 text-zinc-400" />
            Ação:
          </span>
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-medium">
            <button
              onClick={() => setActionCategory('ALL')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${actionCategory === 'ALL'
                ? 'bg-white font-bold text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActionCategory('LOGINS')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${actionCategory === 'LOGINS'
                ? 'bg-white font-bold text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Logins
            </button>
            <button
              onClick={() => setActionCategory('CREATES')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${actionCategory === 'CREATES'
                ? 'bg-white font-bold text-emerald-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Criações
            </button>
            <button
              onClick={() => setActionCategory('UPDATES')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${actionCategory === 'UPDATES'
                ? 'bg-white font-bold text-amber-800 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Atualizações
            </button>
            <button
              onClick={() => setActionCategory('DELETES')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${actionCategory === 'DELETES'
                ? 'bg-white font-bold text-red-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Exclusões
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Dados, Skeleton ou Estado Vazio */}
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
                  <div className="h-8 w-24 rounded-xl bg-zinc-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 mb-4">
            <ShieldAlert className="size-8" />
          </div>

          <h3 className="text-base font-bold text-zinc-950">
            {searchQuery || actionCategory !== 'ALL'
              ? 'Nenhum registro correspondente encontrado'
              : 'Nenhum evento de auditoria registrado ainda'}
          </h3>

          <p className="mt-1.5 max-w-md mx-auto text-xs text-zinc-500 leading-relaxed">
            {searchQuery || actionCategory !== 'ALL'
              ? 'Não encontramos nenhum evento de auditoria com os critérios e filtros de pesquisa selecionados.'
              : 'Todos os acessos e alterações críticas de dados na plataforma serão registrados automaticamente nesta trilha auditável.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery || actionCategory !== 'ALL' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActionCategory('ALL');
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition cursor-pointer"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={() => loadAuditLogs(1)}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Atualizar Trilha</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-zinc-50/80 text-xs font-semibold text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3.5">Data / Hora</th>
                  <th className="px-5 py-3.5">Usuário</th>
                  <th className="px-5 py-3.5">Ação Realizada</th>
                  <th className="px-5 py-3.5">Recurso & ID</th>
                  <th className="px-5 py-3.5">Endereço IP</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((log) => {
                  const badge = getActionBadge(log.action);
                  const initials = log.userName
                    ? log.userName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={log.id}
                      className="transition hover:bg-zinc-50/70"
                    >
                      {/* Data / Hora */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-zinc-700">
                          <Calendar className="size-3.5 text-zinc-400" />
                          <span className="font-medium">{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* Usuário com Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {log.userName || 'Sistema'}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {log.userEmail || (log.userId ? `ID: ${log.userId.slice(0, 8)}...` : 'Automático')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Badge da Ação */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}
                        >
                          <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Recurso & ID */}
                      <td className="px-5 py-4">
                        <div className="text-xs">
                          <span className="font-semibold text-zinc-800 uppercase tracking-wider">
                            {log.resource}
                          </span>
                          {log.resourceId && (
                            <p className="truncate text-[11px] font-mono text-zinc-500 max-w-40">
                              #{log.resourceId}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Endereço IP */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Globe className="size-3.5 text-zinc-400" />
                          <span>{log.ipAddress || 'Interno'}</span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(log)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition cursor-pointer"
                        >
                          <Eye className="size-3.5 text-zinc-500" />
                          <span>Ver Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {!loading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs text-zinc-500">
            Mostrando <strong className="font-semibold text-zinc-900">{startRecord}</strong> até{' '}
            <strong className="font-semibold text-zinc-900">{endRecord}</strong> de{' '}
            <strong className="font-semibold text-zinc-900">{total}</strong> registros de auditoria
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              <span>Anterior</span>
            </button>

            <span className="px-3 text-xs font-semibold text-zinc-700">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Próxima</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Auditoria */}
      <AuditDetailModal
        isOpen={isModalOpen}
        item={selectedLog}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
