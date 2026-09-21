'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Check, Code2, Copy, Globe, HardDrive, Info, Laptop, ShieldAlert, ShieldCheck, User, X } from 'lucide-react';
import type { AuditAction, AuditLogItem } from '@/src/types';

export interface AuditDetailModalProps {
  isOpen: boolean;
  item: AuditLogItem | null;
  onClose: () => void;
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getActionLabel(action: AuditAction): string {
  switch (action) {
    case 'AUTH_LOGIN':
      return 'Login Realizado';
    case 'AUTH_LOGOUT':
      return 'Logout Realizado';
    case 'USER_CREATE':
      return 'Criação de Usuário';
    case 'USER_UPDATE':
      return 'Atualização de Usuário';
    case 'USER_ROLE_CHANGE':
      return 'Alteração de Cargo';
    case 'USER_DELETE':
      return 'Exclusão de Usuário';
    case 'CARRIER_CREATE':
      return 'Criação de Transportadora';
    case 'CARRIER_UPDATE':
      return 'Atualização de Transportadora';
    case 'CARRIER_DELETE':
      return 'Exclusão de Transportadora';
    case 'CUSTOMER_CREATE':
      return 'Criação de Cliente';
    case 'CUSTOMER_UPDATE':
      return 'Atualização de Cliente';
    case 'CUSTOMER_DELETE':
      return 'Exclusão de Cliente';
    default:
      return action;
  }
}

export function getActionBadge(action: AuditAction) {
  if (action.includes('CREATE')) {
    return {
      label: getActionLabel(action),
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
      dotClass: 'bg-emerald-500',
    };
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT')) {
    return {
      label: getActionLabel(action),
      className: 'bg-blue-50 text-blue-700 ring-blue-200/80',
      dotClass: 'bg-blue-500',
    };
  }
  if (action.includes('DELETE')) {
    return {
      label: getActionLabel(action),
      className: 'bg-red-50 text-red-700 ring-red-200/80',
      dotClass: 'bg-red-500',
    };
  }
  return {
    label: getActionLabel(action),
    className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    dotClass: 'bg-amber-500',
  };
}

export function AuditDetailModal({ isOpen, item, onClose }: AuditDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const actionBadge = getActionBadge(item.action);
  const hasDetails = item.details && Object.keys(item.details).length > 0;
  const detailsJson = item.details ? JSON.stringify(item.details, null, 2) : '';

  const handleCopyJson = () => {
    if (!detailsJson) return;
    navigator.clipboard.writeText(detailsJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userInitials = item.userName
    ? item.userName
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop com blur suave */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Caixa de Diálogo do Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                  Registro de Auditoria
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${actionBadge.className}`}
                >
                  <span className={`size-1.5 rounded-full ${actionBadge.dotClass}`} />
                  {actionBadge.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5 text-zinc-400" />
                  {formatDateTime(item.createdAt)}
                </span>
                <span>•</span>
                <span className="font-mono text-zinc-400">ID: {item.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Metadados Principais */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Usuário Responsável */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <User className="size-3.5 text-zinc-400" />
              <span>Usuário Responsável</span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                {userInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900">
                  {item.userName || 'Sistema Automático'}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {item.userEmail || (item.userId ? `ID: ${item.userId}` : 'Ação de sistema')}
                </p>
              </div>
            </div>
          </div>

          {/* Recurso Auditado */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <HardDrive className="size-3.5 text-zinc-400" />
              <span>Recurso Afetado</span>
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                {item.resource}
              </p>
              <p className="mt-0.5 truncate text-xs font-mono text-zinc-500">
                {item.resourceId ? `ID do Recurso: ${item.resourceId}` : 'Sem identificador específico'}
              </p>
            </div>
          </div>

          {/* Endereço IP */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Globe className="size-3.5 text-zinc-400" />
              <span>Endereço IP de Origem</span>
            </div>
            <p className="mt-2 text-sm font-mono font-semibold text-zinc-800">
              {item.ipAddress || 'Não registrado / Interno'}
            </p>
          </div>

          {/* User-Agent */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Laptop className="size-3.5 text-zinc-400" />
              <span>Dispositivo / Navegador</span>
            </div>
            <p className="mt-2 truncate text-xs text-zinc-600" title={item.userAgent || 'Não informado'}>
              {item.userAgent || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Detalhes / Carga de Dados (JSON / Diffs) */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-950">Detalhes do Evento</h3>
              {hasDetails && (
                <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('formatted')}
                    className={`rounded-md px-2.5 py-1 transition cursor-pointer ${activeTab === 'formatted'
                        ? 'bg-white font-semibold text-zinc-900 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                  >
                    Formatado
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition cursor-pointer ${activeTab === 'raw'
                        ? 'bg-white font-semibold text-zinc-900 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                  >
                    <Code2 className="size-3.5" />
                    <span>JSON Puro</span>
                  </button>
                </div>
              )}
            </div>

            {hasDetails && (
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-zinc-400" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-3">
            {hasDetails ? (
              activeTab === 'formatted' ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-2.5">
                  {Object.entries(item.details!).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 border-b border-zinc-200/40 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-mono text-xs font-semibold text-zinc-600 sm:w-1/3">
                        {key}:
                      </span>
                      <span className="font-mono text-xs text-zinc-900 sm:w-2/3 break-all">
                        {typeof val === 'object' && val !== null ? (
                          <pre className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-zinc-900 p-2 text-[11px] text-zinc-100">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          String(val)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-amber-300">
                  {detailsJson}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center bg-zinc-50/30">
                <Info className="size-6 text-zinc-400 mb-2" />
                <p className="text-xs font-medium text-zinc-600">
                  Nenhum dado adicional registrado para esta operação.
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Os parâmetros principais de auditoria foram armazenados no cabeçalho do evento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
