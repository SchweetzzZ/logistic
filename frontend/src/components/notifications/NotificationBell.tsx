'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Download,
  FileSpreadsheet,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNotificationContext } from '@/src/context/NotificationContext';
import type { RealtimeNotification } from '@/src/types/reports';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600)
      return `Há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400)
      return `Há ${Math.floor(diffInSeconds / 3600)} h`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    downloadFromNotification,
  } = useNotificationContext();

  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = async (fileName?: string) => {
    if (!fileName) return;
    try {
      setDownloadingFile(fileName);
      await downloadFromNotification(fileName);
    } finally {
      setDownloadingFile(null);
    }
  };

  const getStatusBadge = () => {
    if (connectionStatus === 'connected') {
      return (
        <span
          title="Conectado"
          className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Conectado
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botão de Notificações com Ícone de Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir central de notificações"
        aria-expanded={isOpen}
        className={`relative flex size-9 items-center justify-center rounded-xl transition cursor-pointer ${
          isOpen
            ? 'bg-amber-100 text-zinc-950 ring-1 ring-amber-300'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
        }`}
      >
        <Bell className="size-[18px]" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-zinc-950 shadow-xs ring-2 ring-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200/90 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Cabeçalho do Dropdown */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-950">
                Notificações
              </h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-950 transition cursor-pointer"
                >
                  <CheckCheck className="size-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Limpar histórico"
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/60 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
                  <Bell className="size-6" />
                </span>
                <p className="text-sm font-medium text-zinc-900">
                  Nenhuma notificação no momento
                </p>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Quando um novo relatório ou atualização estiver disponível,
                  você será avisado instantaneamente aqui.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isReport = notif.type === 'REPORT_READY';
                const fileName = notif.data?.fileName;

                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`group relative flex flex-col gap-2 p-3.5 transition cursor-pointer ${
                      notif.read
                        ? 'bg-white hover:bg-zinc-50/80'
                        : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                          isReport
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {isReport ? (
                          <FileSpreadsheet className="size-4" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              notif.read ? 'text-zinc-800' : 'text-zinc-950 font-bold'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-zinc-600 leading-snug line-clamp-2">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Clock className="size-3" />
                            {formatRelativeTime(notif.timestamp)}
                          </span>

                          {isReport && fileName && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                                handleDownload(fileName);
                              }}
                              disabled={downloadingFile === fileName}
                              className="flex items-center gap-1 rounded-lg bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-amber-400 hover:bg-zinc-800 transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              <Download className="size-3" />
                              <span>
                                {downloadingFile === fileName
                                  ? 'Baixando...'
                                  : 'Baixar CSV'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé informativo */}
          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-center text-[11px] text-zinc-500">
            Notificações em tempo real
          </div>
        </div>
      )}
    </div>
  );
}
