'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  description?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  description = 'Esta ação não pode ser desfeita. Todos os dados vinculados serão permanentemente removidos da sua empresa.',
  isLoading = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
            {itemName && (
              <p className="mt-1 text-sm font-medium text-zinc-800">
                Item: <span className="font-semibold text-zinc-950">{itemName}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-hidden disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 focus:outline-hidden disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Removendo...</span>
              </>
            ) : (
              <span>Confirmar exclusão</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
