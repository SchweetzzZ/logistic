'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit2,
  Hash,
  Info,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { tenantService } from '@/src/services/tenant';
import { usersService } from '@/src/services/users';
import type {
  Tenant,
  UserEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@/src/types';
import { EmployeeModal } from './EmployeeModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export function formatCNPJ(value?: string): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return value;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

export function CompanyManagement() {
  const [activeTab, setActiveTab] = useState<'details' | 'team'>('details');

  // Estados de Tenant
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Estados da Equipe (Usuários)
  const [employees, setEmployees] = useState<UserEmployee[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Colaborador
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserEmployee | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal de Exclusão de Colaborador
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<UserEmployee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notificações / Toast
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

  // Carrega dados da empresa
  const loadTenant = async () => {
    try {
      setTenantLoading(true);
      const data = await tenantService.getCurrent();
      if (data) {
        setTenant(data);
        setCompanyName(data.name);
      }
    } catch {
      showNotification('error', 'Falha ao buscar dados cadastrais da empresa.');
    } finally {
      setTenantLoading(false);
    }
  };

  // Carrega colaboradores da empresa
  const loadEmployees = async () => {
    try {
      setTeamLoading(true);
      const data = await usersService.list();
      setEmployees(data);
    } catch {
      showNotification('error', 'Falha ao carregar lista de colaboradores.');
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
    loadEmployees();
  }, []);

  // Copiar ID do Tenant
  const handleCopyTenantId = () => {
    if (tenant?.id) {
      navigator.clipboard.writeText(tenant.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Salvar Razão Social / Nome da Empresa
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showNotification('error', 'A Razão Social / Nome da empresa não pode ficar vazia.');
      return;
    }

    try {
      setSavingCompany(true);
      const res = await tenantService.updateCurrent({ name: companyName.trim() });
      if (res.error) {
        showNotification('error', res.error);
        return;
      }

      if (res.data) {
        setTenant(res.data);
        setCompanyName(res.data.name);
      }
      showNotification('success', 'Dados da empresa atualizados com sucesso!');
    } catch {
      showNotification('error', 'Erro ao atualizar informações da empresa.');
    } finally {
      setSavingCompany(false);
    }
  };

  // Abrir Modal para Novo Colaborador
  const handleOpenNewEmployee = () => {
    setSelectedEmployee(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Edição de Colaborador
  const handleOpenEditEmployee = (emp: UserEmployee) => {
    setSelectedEmployee(emp);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Salvar Colaborador (Criação ou Edição)
  const handleSaveEmployee = async (data: CreateEmployeeInput | UpdateEmployeeInput) => {
    try {
      setModalLoading(true);
      setModalError(null);

      if (selectedEmployee) {
        const res = await usersService.update(selectedEmployee.id, data as UpdateEmployeeInput);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Colaborador atualizado com sucesso!');
      } else {
        const res = await usersService.create(data as CreateEmployeeInput);
        if (res.error) {
          setModalError(res.error);
          return;
        }
        showNotification('success', 'Colaborador cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      await loadEmployees();
    } catch {
      setModalError('Erro inesperado ao salvar colaborador.');
    } finally {
      setModalLoading(false);
    }
  };

  // Abrir Confirmação de Exclusão
  const handleOpenDelete = (emp: UserEmployee) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
  };

  // Confirmar Exclusão de Colaborador
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await usersService.remove(employeeToDelete.id);
      if (!res.success || res.error) {
        showNotification('error', res.error || 'Falha ao remover colaborador.');
        return;
      }

      showNotification('success', `Colaborador ${employeeToDelete.name} removido com sucesso.`);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      await loadEmployees();
    } catch {
      showNotification('error', 'Erro ao remover colaborador.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtro de colaboradores
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Configurações da Empresa & Equipe
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie as informações cadastrais da sua organização e o acesso dos seus colaboradores.
          </p>
        </div>

        {activeTab === 'team' && (
          <button
            onClick={handleOpenNewEmployee}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
          >
            <UserPlus className="size-4 text-amber-400" />
            <span>Novo Colaborador</span>
          </button>
        )}
      </div>

      {/* Notificação / Toast */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 shadow-xs transition-all ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
              : 'border-red-200 bg-red-50/80 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-red-600" />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Seletor de Abas (Tabs) */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`inline-flex items-center gap-2.5 border-b-2 py-3 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            <Building2 className="size-4" />
            <span>Dados Cadastrais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-2.5 border-b-2 py-3 px-1 text-sm font-semibold transition cursor-pointer ${
              activeTab === 'team'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            <Users className="size-4" />
            <span>Equipe & Colaboradores</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'team'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {employees.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ABA 1: DADOS CADASTRAIS DA EMPRESA */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {tenantLoading ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-8">
              <div className="flex items-center justify-center gap-3 text-zinc-500">
                <Loader2 className="size-6 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Carregando dados da empresa...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Card de Visão Geral / Status */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                      <Building className="size-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-zinc-900">
                          {tenant?.name || 'Sua Empresa'}
                        </h2>
                        {/* Badge de Status */}
                        {tenant?.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Ativa
                          </span>
                        )}
                        {tenant?.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Inativa
                          </span>
                        )}
                        {tenant?.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-600/20">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Suspensa
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        Ambiente corporativo multi-tenant isolado e seguro.
                      </p>
                    </div>
                  </div>

                  {/* Informações Rápidas */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3.5 py-2 ring-1 ring-zinc-200/60">
                      <Hash className="size-4 text-zinc-400" />
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-semibold text-zinc-400">ID da Conta</p>
                        <p className="font-mono text-xs font-medium text-zinc-700">
                          {tenant?.id ? `${tenant.id.slice(0, 10)}...` : '—'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyTenantId}
                        title="Copiar ID Completo"
                        className="ml-1 rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 cursor-pointer"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {copiedId && (
                        <span className="text-[10px] font-semibold text-emerald-600">Copiado!</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3.5 py-2 ring-1 ring-zinc-200/60">
                      <Calendar className="size-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-zinc-400">Criada em</p>
                        <p className="text-xs font-medium text-zinc-700">
                          {tenant?.createdAt
                            ? new Date(tenant.createdAt).toLocaleDateString('pt-BR')
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulário de Edição */}
                <form onSubmit={handleSaveTenant} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Razão Social / Nome da Empresa */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Razão Social / Nome da Empresa <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Ex: Transportes & Logística S/A"
                          className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 py-2.5 text-sm font-medium text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Nome exibido nos relatórios, propostas comerciais de frete e cabeçalhos.
                      </p>
                    </div>

                    {/* Documento / CNPJ (Somente Leitura / Identificador Fiscal) */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        CNPJ da Empresa
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formatCNPJ(tenant?.document)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-100/70 pl-10 pr-3.5 py-2.5 text-sm font-mono text-zinc-600 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Identificador fiscal único registrado no contrato da plataforma.
                      </p>
                    </div>

                    {/* Data de Criação Completa */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Data de Ativação do Sistema
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={
                            tenant?.createdAt
                              ? new Date(tenant.createdAt).toLocaleString('pt-BR')
                              : '—'
                          }
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-100/70 pl-10 pr-3.5 py-2.5 text-sm text-zinc-600 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Timestamp registrado na ativação da conta da empresa.
                      </p>
                    </div>
                  </div>

                  {/* Informação contextual */}
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50/60 p-4 ring-1 ring-amber-200/50">
                    <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      As alterações na Razão Social são refletidas instantaneamente em toda a plataforma,
                      incluindo simulações de frete, exportações e painéis da sua equipe.
                    </p>
                  </div>

                  {/* Botão de Salvar */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingCompany}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 cursor-pointer transition"
                    >
                      {savingCompany ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-amber-400" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="size-4 text-amber-400" />
                          <span>Salvar Alterações</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* ABA 2: EQUIPE & COLABORADORES */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-sm text-zinc-900 transition focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 self-end sm:self-auto">
              <span>Total de colaboradores:</span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-bold text-zinc-900">
                {employees.length}
              </span>
            </div>
          </div>

          {/* Tabela de Colaboradores */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3.5">Colaborador</th>
                    <th className="px-5 py-3.5">E-mail</th>
                    <th className="px-5 py-3.5">Cargo / Função</th>
                    <th className="px-5 py-3.5">Data de Admissão</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {teamLoading ? (
                    // Skeletons de Carregamento
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-zinc-200" />
                            <div className="h-4 w-32 rounded-md bg-zinc-200" />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-40 rounded-md bg-zinc-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-5 w-24 rounded-md bg-zinc-200" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-24 rounded-md bg-zinc-200" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-block h-8 w-16 rounded-md bg-zinc-200" />
                        </td>
                      </tr>
                    ))
                  ) : filteredEmployees.length === 0 ? (
                    // Estado Vazio
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 mb-3">
                            <UsersRound className="size-7" />
                          </div>
                          <h3 className="text-base font-semibold text-zinc-900">
                            {searchQuery
                              ? 'Nenhum colaborador encontrado'
                              : 'Nenhum colaborador cadastrado'}
                          </h3>
                          <p className="mt-1 max-w-sm text-xs text-zinc-500">
                            {searchQuery
                              ? `Não encontramos nenhum membro da equipe correspondente a "${searchQuery}".`
                              : 'Cadastre os membros da sua equipe para delegar acessos de Gerente ou Operador.'}
                          </p>
                          {!searchQuery && (
                            <button
                              onClick={handleOpenNewEmployee}
                              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                            >
                              <Plus className="size-4 text-amber-400" />
                              <span>Cadastrar primeiro colaborador</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Linhas de Colaboradores
                    filteredEmployees.map((emp) => {
                      const initials = emp.name
                        ? emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : '??';

                      const formattedDate = emp.createdAt
                        ? new Date(emp.createdAt).toLocaleDateString('pt-BR')
                        : '—';

                      return (
                        <tr
                          key={emp.id}
                          className="group hover:bg-zinc-50/80 transition-colors"
                        >
                          {/* Colaborador / Nome */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-amber-400 ring-2 ring-zinc-100">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-zinc-900 truncate">
                                  {emp.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-zinc-600">
                              <Mail className="size-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                          </td>

                          {/* Cargo / Role */}
                          <td className="px-5 py-4">
                            {emp.role === 'ADMIN' && (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                                <ShieldAlert className="size-3.5" />
                                Administrador
                              </span>
                            )}
                            {emp.role === 'MANAGER' && (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                <ShieldCheck className="size-3.5" />
                                Gerente
                              </span>
                            )}
                            {emp.role === 'OPERATOR' && (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <Shield className="size-3.5" />
                                Operador
                              </span>
                            )}
                          </td>

                          {/* Data de Admissão */}
                          <td className="px-5 py-4 text-zinc-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-zinc-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmployee(emp)}
                                title="Editar colaborador"
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(emp)}
                                title="Excluir colaborador"
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
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
        </div>
      )}

      {/* Modal de Criação / Edição de Colaborador */}
      <EmployeeModal
        isOpen={isModalOpen}
        employee={selectedEmployee}
        isLoading={modalLoading}
        errorMessage={modalError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveEmployee}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Colaborador"
        itemName={employeeToDelete?.name}
        description="Esta ação removerá permanentemente o acesso deste colaborador à sua empresa e revogará todas as sessões ativas."
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
      />
    </div>
  );
}
