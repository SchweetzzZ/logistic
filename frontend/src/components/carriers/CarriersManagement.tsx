'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Building, CheckCircle2, Clock, DollarSign, Edit2, Mail, Phone, Plus, Power, Search, Trash2, Truck, Upload } from 'lucide-react';
import { carriersService } from '@/src/services/carriers';
import { Carrier, CreateCarrierInput, UpdateCarrierInput } from '@/src/types';
import { CarrierModal, formatCNPJorCPF } from './CarrierModal';
import { CarrierImportModal } from './CarrierImportModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export function CarriersManagement() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<Carrier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notificações
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const data = await carriersService.list();
      setCarriers(data);
    } catch {
      showNotification('error', 'Falha ao buscar a lista de transportadoras no servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarriers();
  }, []);

  const handleOpenNew = () => {
    setSelectedCarrier(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveCarrier = async (data: CreateCarrierInput | UpdateCarrierInput) => {
    try {
      setModalLoading(true);
      setModalError(null);

      if (selectedCarrier) {
        const res = await carriersService.update(selectedCarrier.id, data);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Transportadora atualizada com sucesso!');
      } else {
        const res = await carriersService.create(data as CreateCarrierInput);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Transportadora parceira cadastrada com sucesso!');
      }

      setIsModalOpen(false);
      await loadCarriers();
    } catch {
      setModalError('Erro inesperado ao salvar transportadora.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (carrier: Carrier) => {
    const nextStatus = carrier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await carriersService.update(carrier.id, { status: nextStatus });
      if (res.error) {
        showNotification('error', res.error);
        return;
      }
      showNotification(
        'success',
        `Transportadora ${carrier.name} ${nextStatus === 'ACTIVE' ? 'ativada' : 'desativada'}.`,
      );
      await loadCarriers();
    } catch {
      showNotification('error', 'Erro ao alterar status da transportadora.');
    }
  };

  const handleOpenDelete = (carrier: Carrier) => {
    setCarrierToDelete(carrier);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!carrierToDelete) return;

    try {
      setDeleteLoading(true);
      const res = await carriersService.delete(carrierToDelete.id);
      if (!res.success) {
        showNotification('error', res.error || 'Falha ao excluir transportadora.');
        return;
      }
      showNotification('success', `Transportadora ${carrierToDelete.name} removida.`);
      setDeleteModalOpen(false);
      setCarrierToDelete(null);
      await loadCarriers();
    } catch {
      showNotification('error', 'Erro ao remover a transportadora.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtragem local por texto e status
  const filteredCarriers = carriers.filter((c) => {
    const matchQuery =
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.document.includes(searchQuery.replace(/\D/g, ''));

    const matchStatus =
      statusFilter === 'ALL' || c.status === statusFilter;

    return matchQuery && matchStatus;
  });

  const totalCount = carriers.length;
  const activeCount = carriers.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 shadow-lg ring-1 transition-all ${notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
            : 'bg-red-50 text-red-900 ring-red-200'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-red-600" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Truck className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Transportadoras Parceiras
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre as transportadoras, defina as taxas e prazos operacionais para cotação automatizada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 cursor-pointer"
          >
            <Upload className="size-4 text-amber-500" />
            <span>Importar CSV</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="size-4 text-amber-400" />
            <span>Nova Transportadora</span>
          </button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Total de Parceiras</span>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{totalCount}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Ativas para Cotação</span>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Inativas / Pausadas</span>
          <p className="mt-1 text-2xl font-bold text-zinc-500">{inactiveCount}</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-9 pr-4 text-sm transition placeholder:text-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-zinc-500">Status:</span>
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${statusFilter === 'ALL'
                ? 'bg-white font-bold text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${statusFilter === 'ACTIVE'
                ? 'bg-white font-bold text-emerald-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Ativas ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${statusFilter === 'INACTIVE'
                ? 'bg-white font-bold text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
                }`}
            >
              Inativas ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Transportadoras */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3.5">Transportadora</th>
                <th className="px-5 py-3.5">CNPJ / Documento</th>
                <th className="px-5 py-3.5">Taxa Base</th>
                <th className="px-5 py-3.5">Preço / Kg</th>
                <th className="px-5 py-3.5">Prazo Médio</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-zinc-200" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-36 rounded-md bg-zinc-200" />
                          <div className="h-3 w-24 rounded-md bg-zinc-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-20 rounded-full bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-block h-8 w-16 rounded-md bg-zinc-200" />
                    </td>
                  </tr>
                ))
              ) : filteredCarriers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 mb-3">
                        <Truck className="size-7" />
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'Nenhuma transportadora encontrada'
                          : 'Nenhuma transportadora cadastrada'}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-zinc-500">
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'Nenhum resultado corresponde aos filtros selecionados.'
                          : 'Cadastre suas parceiras para habilitar o cálculo e roteirização inteligente de frete no dashboard.'}
                      </p>
                      {!searchQuery && statusFilter === 'ALL' && (
                        <button
                          onClick={handleOpenNew}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <Plus className="size-4 text-amber-400" />
                          <span>Cadastrar primeira parceira</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCarriers.map((c) => {
                  const isActive = c.status === 'ACTIVE';
                  const basePriceFormatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(c.basePrice) || 0);

                  const priceKgFormatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(c.pricePerKg) || 0);

                  return (
                    <tr key={c.id} className="group hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${isActive
                              ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                              : 'bg-zinc-100 text-zinc-600'
                              }`}
                          >
                            <Truck className="size-4" />
                          </span>
                          <div>
                            <span className="block font-semibold text-zinc-950">
                              {c.name}
                            </span>
                            {c.email && (
                              <span className="block text-xs text-zinc-500">
                                {c.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-zinc-700">
                        {formatCNPJorCPF(c.document)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-xs text-zinc-900">
                        {basePriceFormatted}
                      </td>

                      <td className="px-5 py-4 font-semibold text-xs text-zinc-900">
                        {priceKgFormatted}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-700">
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-medium">
                          <Clock className="size-3 text-zinc-500" />
                          {c.deadlineDays} {c.deadlineDays === 1 ? 'dia' : 'dias'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-200'
                            }`}
                          title="Clique para alternar o status"
                        >
                          <span
                            className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                              }`}
                          />
                          {isActive ? 'Ativa' : 'Inativa'}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
                            title={isActive ? 'Pausar parceira' : 'Ativar parceira'}
                            aria-label="Alternar status"
                          >
                            <Power className={`size-4 ${isActive ? 'text-amber-600' : 'text-zinc-400'}`} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                            title="Editar transportadora"
                            aria-label={`Editar ${c.name}`}
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(c)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            title="Excluir transportadora"
                            aria-label={`Excluir ${c.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <CarrierModal
        isOpen={isModalOpen}
        carrier={selectedCarrier}
        isLoading={modalLoading}
        errorMessage={modalError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCarrier}
      />

      {/* Modal de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Transportadora"
        itemName={carrierToDelete?.name}
        description="Deseja realmente remover esta parceira? Ela deixará de constar nas novas cotações e simulações de frete."
        isLoading={deleteLoading}
        onClose={() => {
          setDeleteModalOpen(false);
          setCarrierToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de Importação CSV */}
      <CarrierImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadCarriers();
          showNotification('success', 'Base de transportadoras atualizada com sucesso!');
        }}
      />
    </div>
  );
}
