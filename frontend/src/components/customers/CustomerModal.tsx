'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, MapPin, Search, User, X } from 'lucide-react';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/src/types';

interface CustomerModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
}

// Helpers de formatação e máscaras
export function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function CustomerModal({
  isOpen,
  customer,
  isLoading = false,
  errorMessage,
  onClose,
  onSubmit,
}: CustomerModalProps) {
  const isEditing = Boolean(customer);

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [loadingCep, setLoadingCep] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setCpf(formatCPF(customer.cpf || ''));
      setEmail(customer.email || '');
      setPhone(customer.phone ? formatPhone(customer.phone) : '');
      setZipCode(customer.zipCode ? formatCEP(customer.zipCode) : '');
      setStreet(customer.street || '');
      setNumber(customer.number || '');
      setComplement(customer.complement || '');
      setCity(customer.city || '');
      setState(customer.state || '');
    } else {
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setZipCode('');
      setStreet('');
      setNumber('');
      setComplement('');
      setCity('');
      setState('');
    }
    setLocalError(null);
  }, [customer, isOpen]);

  const handleCepLookup = async (inputCep: string) => {
    const raw = inputCep.replace(/\D/g, '');
    if (raw.length !== 8) return;

    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setStreet(data.logradouro);
        if (data.complemento && !complement) setComplement(data.complemento);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setState(data.uf);
      }
    } catch {
      // Ignora erro externo silenciosamente
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!name.trim()) {
      setLocalError('O nome do cliente é obrigatório.');
      return;
    }
    if (cleanCpf.length !== 11) {
      setLocalError('Informe um CPF válido com 11 dígitos.');
      return;
    }

    const payload: CreateCustomerInput = {
      name: name.trim(),
      cpf: cleanCpf,
      email: email.trim() || null,
      phone: phone.replace(/\D/g, '') || null,
      zipCode: zipCode.replace(/\D/g, '') || null,
      street: street.trim() || null,
      number: number.trim() || null,
      complement: complement.trim() || null,
      city: city.trim() || null,
      state: state.trim().toUpperCase() || null,
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? 'Atualize os dados cadastrais e endereço do cliente.'
                  : 'Preencha os dados do cliente para vincular às operações da sua empresa.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {(errorMessage || localError) && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span className="font-medium">{errorMessage || localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Maria Silva"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm font-mono text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com.br"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="size-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Endereço de Entrega / Faturamento
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value);
                      setZipCode(formatted);
                      if (formatted.replace(/\D/g, '').length === 8) {
                        handleCepLookup(formatted);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 pr-9 text-sm font-mono text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    {loadingCep ? (
                      <Loader2 className="size-4 animate-spin text-amber-600" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Logradouro / Rua
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Paulista, Rua das Flores"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123 ou S/N"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 42, Bloco B, Galpão 3"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  UF / Estado
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm uppercase font-semibold text-zinc-900 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>
          </div>

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
                <span>{isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
