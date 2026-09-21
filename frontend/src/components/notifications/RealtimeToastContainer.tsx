'use client';

import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Sparkles, X } from 'lucide-react';
import { useNotificationContext } from '@/src/context/NotificationContext';
import type { RealtimeNotification } from '@/src/types/reports';

function ToastItem({
  item,
  onDismiss,
  onDownload,
}: {
  item: RealtimeNotification;
  onDismiss: (id: string) => void;
  onDownload: (fileName?: string) => Promise<void>;
}) {
  const [downloading, setDownloading] = useState(false);

  // Auto-dismiss após 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await onDownload(item.data?.fileName);
    } finally {
      setDownloading(false);
    }
  };

  const isReport = item.type === 'REPORT_READY';

  return (
    <div
      role="alert"
      className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-2xl border border-amber-300/80 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 shadow-xs">
            {isReport ? (
              <FileSpreadsheet className="size-5" />
            ) : (
              <Sparkles className="size-5" />
            )}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-950">{item.title}</h4>
            <p className="mt-0.5 text-xs text-zinc-600 leading-relaxed">
              {item.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(item.id)}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
          aria-label="Fechar notificação"
        >
          <X className="size-4" />
        </button>
      </div>

      {isReport && item.data?.fileName && (
        <div className="mt-1 flex items-center justify-end gap-2 border-t border-zinc-100 pt-2.5">
          <button
            onClick={() => onDismiss(item.id)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
          >
            Dispensar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-amber-400 shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>{downloading ? 'Baixando...' : 'Baixar CSV'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function RealtimeToastContainer() {
  const { activeToasts, dismissToast, downloadFromNotification } =
    useNotificationContext();

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 sm:bottom-6 sm:right-6"
    >
      {activeToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          item={toast}
          onDismiss={dismissToast}
          onDownload={downloadFromNotification}
        />
      ))}
    </div>
  );
}
