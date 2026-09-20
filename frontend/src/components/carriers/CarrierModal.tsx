'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, DollarSign, Loader2, ShieldCheck, Truck, X } from 'lucide-react';
import { Carrier, CreateCarrierInput, UpdateCarrierInput } from '@/src/types';

interface CarrierModalProps {
  isOpen: boolean;
  carrier?: Carrier | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateCarrierInput | UpdateCarrierInput) => Promise<void>;
}

export function formatCNPJorCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function CarrierModal({
  isOpen,
  carrier,
  isLoading = false,
  errorMessage,
  onClose,
  onSubmit,
}: CarrierModalProps) {
  const isEditing = Boolean(carrier);

  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [basePrice, setBasePrice] = useState<string>('0');
  const [pricePerKg, setPricePerKg] = useState<string>('0');
  const [deadlineDays, setDeadlineDays] = useState<number>(3);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (carrier) {
      setName(carrier.name || '');
      setDocument(formatCNPJorCPF(carrier.document || ''));
      setEmail(carrier.email || '');
      setPhone(carrier.phone || '');
      setBasePrice(String(carrier.basePrice || '0'));
      setPricePerKg(String(carrier.pricePerKg || '0'));
      setDeadlineDays(carrier.deadlineDays || 3);
      setStatus(carrier.status || 'ACTIVE');
    } else {
      setName('');
      setDocument('');
      setEmail('');
      setPhone('');
      setBasePrice('0');
      setPricePerKg('0');
      setDeadlineDays(3);
      setStatus('ACTIVE');
    }
    setLocalError(null);
  }, [carrier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanDoc = document.replace(/\D/g, '');
    if (!name.trim()) {
      setLocalError('A razão social ou nome da transportadora é obrigatório.');
      return;
    }
    if (cleanDoc.length < 11) {
      setLocalError('Informe um CNPJ ou CPF válido.');
      return;
    }

    const numBasePrice = parseFloat(basePrice.replace(',', '.')) || 0;
    const numPricePerKg = parseFloat(pricePerKg.replace(',', '.')) || 0;
    const numDeadline = Math.max(1, parseInt(String(deadlineDays), 10) || 1);

    const payload: CreateCarrierInput = {
      name: name.trim(),
      document: cleanDoc,
      email: email.trim() || null,
      phone: phone.replace(/\D/g, '') || null,
      basePrice: numBasePrice,
      pricePerKg: numPricePerKg,
      deadlineDays: numDeadline,
      status,
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

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Truck className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                {isEditing ? 'Editar Transportadora' : 'Nova Transportadora'}
              </h2>
              <p className="text-xs text-zinc-500">
                Configure as taxas e prazos operacionais para cotação automática de fretes.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nome da Transportadora / Razão Social *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Braspress Logística S/A"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                CNPJ ou CPF *
              </label>
              <input
                type="text"
                required
                value={document}
                onChange={(e) => setDocument(formatCNPJorCPF(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full rounded-xl border bg-zinc-50/50 px-3.5 py-2.5 text-sm font-mono text-zinc-900 transition focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Status Operacional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full rounded-xl border bg-zinc-50/50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 transition focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="ACTIVE">Ativa (Habilitada para cotações)</option>
                <option value="INACTIVE">Inativa (Pausada)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                E-mail Operacional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operacoes@transportadora.com"
                className="w-full rounded-xl border bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Parâmetros Tarifários */}
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="size-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Parâmetros Tarifários e Prazos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Taxa Base (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm font-semibold text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Preço por Kg (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm font-semibold text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Prazo Padrão (dias) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Clock className="size-4" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(parseInt(e.target.value, 10) || 1)}
                    placeholder="3"
                    className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm font-semibold text-zinc-900 transition focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
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
                <span>{isEditing ? 'Salvar alterações' : 'Cadastrar transportadora'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
