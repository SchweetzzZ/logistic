'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  AlertCircle, Building2, CheckCircle2, Edit2, Mail, MapPin, Phone, Plus, Search, Trash2,
  Upload, UsersRound
} from 'lucide-react';
import { customersService } from '@/src/services/customers';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/src/types';
import { CustomerModal, formatCPF, formatPhone } from './CustomerModal';
import { CustomerImportModal } from './CustomerImportModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado do Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Alerta de Notificação
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

  // Carrega lista com busca opcional
  const loadCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const data = await customersService.list(search);
      setCustomers(data);
    } catch {
      showNotification('error', 'Falha ao conectar com o servidor para listar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Debounce para pesquisa em tempo real
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        loadCustomers(searchQuery.trim() || undefined);
      });
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Abertura para Novo Cliente
  const handleOpenNew = () => {
    setSelectedCustomer(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Abertura para Edição
  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Salvar (Criação ou Edição)
  const handleSaveCustomer = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    try {
      setModalLoading(true);
      setModalError(null);

      if (selectedCustomer) {
        const res = await customersService.update(selectedCustomer.id, data);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Cliente atualizado com sucesso!');
      } else {
        const res = await customersService.create(data as CreateCustomerInput);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Cliente cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      await loadCustomers(searchQuery.trim() || undefined);
    } catch {
      setModalError('Erro inesperado ao salvar cliente. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  // Abertura do diálogo de Exclusão
  const handleOpenDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  // Confirmação de Exclusão
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteLoading(true);
      const res = await customersService.delete(customerToDelete.id);
      if (!res.success) {
        showNotification('error', res.error || 'Não foi possível excluir o cliente.');
        return;
      }
      showNotification('success', `Cliente ${customerToDelete.name} removido com sucesso.`);
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      await loadCustomers(searchQuery.trim() || undefined);
    } catch {
      showNotification('error', 'Erro ao excluir o cliente.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
              <UsersRound className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Gestão de Clientes
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre, edite e gerencie a base de clientes e destinatários atendidos pela sua empresa.
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
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="size-4 text-amber-400" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-4 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-500">
          <span>Total cadastrados:</span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-bold text-zinc-900">
            {customers.length}
          </span>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">CPF</th>
                <th className="px-5 py-3.5">Contatos</th>
                <th className="px-5 py-3.5">Localização</th>
                <th className="px-5 py-3.5">Cadastro</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                // Skeletons de carregamento
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-zinc-200" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 rounded-md bg-zinc-200" />
                          <div className="h-3 w-20 rounded-md bg-zinc-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 rounded-md bg-zinc-200" />
                        <div className="h-3 w-24 rounded-md bg-zinc-100" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-20 rounded-md bg-zinc-200" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-block h-8 w-16 rounded-md bg-zinc-200" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                // Estado Vazio
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 mb-3">
                        <UsersRound className="size-7" />
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-zinc-500">
                        {searchQuery
                          ? `Não encontramos nenhum cliente correspondente à pesquisa "${searchQuery}".`
                          : 'Cadastre seus clientes para gerenciar entregas, emitir cotações personalizadas e manter os endereços organizados.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={handleOpenNew}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <Plus className="size-4 text-amber-400" />
                          <span>Cadastrar primeiro cliente</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Lista de Clientes
                customers.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const formattedDate = new Date(c.createdAt).toLocaleDateString('pt-BR');

                  return (
                    <tr key={c.id} className="group hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                            {initials}
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
                        {formatCPF(c.cpf)}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-600">
                        <div className="space-y-1">
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <Phone className="size-3.5 text-zinc-400" />
                              <span>{formatPhone(c.phone)}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Mail className="size-3.5 text-zinc-400" />
                              <span className="truncate max-w-45">{c.email}</span>
                            </div>
                          )}
                          {!c.phone && !c.email && <span className="text-zinc-400">—</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-600">
                        {c.city || c.state ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-amber-600 shrink-0" />
                            <span>
                              {c.city || '—'} {c.state ? `(${c.state})` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {formattedDate}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                            title="Editar cliente"
                            aria-label={`Editar ${c.name}`}
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(c)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            title="Excluir cliente"
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
      <CustomerModal
        isOpen={isModalOpen}
        customer={selectedCustomer}
        isLoading={modalLoading}
        errorMessage={modalError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCustomer}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Cliente"
        itemName={customerToDelete?.name}
        description="Tem certeza que deseja remover este cliente? Se houver cotações ou registros vinculados, o histórico pode ser afetado."
        isLoading={deleteLoading}
        onClose={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de Importação CSV */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={async () => {
          await loadCustomers(searchQuery.trim() || undefined);
          showNotification('success', 'Importação processada com sucesso!');
        }}
      />
    </div>
  );
}
