'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  UserEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@/src/types';

interface EmployeeModalProps {
  isOpen: boolean;
  employee?: UserEmployee | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeInput | UpdateEmployeeInput) => Promise<void>;
}

export function EmployeeModal({
  isOpen,
  employee,
  isLoading = false,
  errorMessage,
  onClose,
  onSubmit,
}: EmployeeModalProps) {
  const isEditing = Boolean(employee);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'OPERATOR'>('OPERATOR');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setPassword('');
      setRole(employee.role || 'OPERATOR');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('OPERATOR');
    }
    setLocalError(null);
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setLocalError('O nome completo do colaborador é obrigatório.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setLocalError('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }

    if (!isEditing) {
      if (!password || password.length < 6) {
        setLocalError('A senha de acesso deve ter pelo menos 6 caracteres.');
        return;
      }
    } else if (password && password.length < 6) {
      setLocalError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (isEditing) {
      const payload: UpdateEmployeeInput = {
        name: trimmedName,
        email: trimmedEmail,
        role,
        ...(password.trim() ? { password: password.trim() } : {}),
      };
      await onSubmit(payload);
    } else {
      const payload: CreateEmployeeInput = {
        name: trimmedName,
        email: trimmedEmail,
        password: password.trim(),
        role,
      };
      await onSubmit(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10 sm:p-7 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              {isEditing ? <UserCheck className="size-5" /> : <User className="size-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? 'Atualize os dados e nível de acesso do membro da equipe.'
                  : 'Cadastre um novo usuário com credenciais e perfil de permissão.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mensagens de Erro */}
        {(localError || errorMessage) && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span className="leading-snug">{localError || errorMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              E-mail Corporativo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com.br"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Senha de Acesso {isEditing ? <span className="text-zinc-400 font-normal">(opcional)</span> : <span className="text-red-500">*</span>}
              </label>
              {isEditing && (
                <span className="text-[11px] text-zinc-500">
                  Preencha apenas para alterar
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="password"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '•••••••• (deixe em branco para manter a atual)' : 'Mínimo de 6 caracteres'}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Nível de Acesso (Role) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Cargo & Nível de Permissão <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* ADMIN */}
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`relative flex flex-col rounded-xl border p-3.5 text-left transition cursor-pointer ${
                  role === 'ADMIN'
                    ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      role === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    <ShieldAlert className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900">ADMIN</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-zinc-700">Administrador</p>
                <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
                  Acesso total ao sistema, configurações da empresa e colaboradores.
                </p>
              </button>

              {/* MANAGER */}
              <button
                type="button"
                onClick={() => setRole('MANAGER')}
                className={`relative flex flex-col rounded-xl border p-3.5 text-left transition cursor-pointer ${
                  role === 'MANAGER'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      role === 'MANAGER' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <ShieldCheck className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900">MANAGER</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-zinc-700">Gerente</p>
                <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
                  Gestão operacional, transportadoras, clientes e cotações.
                </p>
              </button>

              {/* OPERATOR */}
              <button
                type="button"
                onClick={() => setRole('OPERATOR')}
                className={`relative flex flex-col rounded-xl border p-3.5 text-left transition cursor-pointer ${
                  role === 'OPERATOR'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      role === 'OPERATOR' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Shield className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900">OPERATOR</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-zinc-700">Operador</p>
                <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
                  Simulação de frete, consultas rotineiras e visualização.
                </p>
              </button>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-amber-400" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Salvar alterações' : 'Cadastrar colaborador'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
