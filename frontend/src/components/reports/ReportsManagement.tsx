'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  Radio,
  Send,
  Trash2,
  Zap,
} from 'lucide-react';
import { reportsService } from '@/src/services/reports';
import { useNotificationContext } from '@/src/context/NotificationContext';
import type { ReportJobItem } from '@/src/types/reports';

const JOBS_STORAGE_KEY = 'logiflow_report_session_jobs';

export function ReportsManagement() {
  const { connectionStatus, latestReportEvent, downloadFromNotification } =
    useNotificationContext();

  // Estados do formulário
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState<number>(1000);

  // Estados de controle
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    jobId: string;
    message: string;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Histórico de Jobs da Sessão
  const [sessionJobs, setSessionJobs] = useState<ReportJobItem[]>([]);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);

  // Carrega histórico de jobs do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(JOBS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setSessionJobs(parsed);
        }
      }
    } catch {
      // Silencia erros de parse do cache
    }
  }, []);

  // Salva no localStorage quando a lista de jobs for alterada
  const persistJobs = (jobs: ReportJobItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      // Ignora erro de storage
    }
  };

  // Reage imediatamente a novos eventos SSE do tipo REPORT_READY
  useEffect(() => {
    if (!latestReportEvent) return;

    setSessionJobs((prev) => {
      const existingIndex = prev.findIndex(
        (j) => j.jobId === latestReportEvent.jobId,
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: 'COMPLETED',
          fileName: latestReportEvent.fileName,
          downloadUrl: latestReportEvent.downloadUrl,
          totalRecords: latestReportEvent.totalRecords,
        };
        persistJobs(updated);
        return updated;
      } else {
        // Se o job não estava na lista da sessão (ex: solicitado em outra aba), inclui na tabela
        const newJob: ReportJobItem = {
          jobId: latestReportEvent.jobId,
          requestedAt: new Date().toISOString(),
          status: 'COMPLETED',
          fileName: latestReportEvent.fileName,
          downloadUrl: latestReportEvent.downloadUrl,
          totalRecords: latestReportEvent.totalRecords,
        };
        const updated = [newJob, ...prev];
        persistJobs(updated);
        return updated;
      }
    });
  }, [latestReportEvent]);

  // Aplica atalhos de data
  const handleSetQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.setDate ? start.toISOString().split('T')[0] : '');
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  // Disparo da exportação assíncrona
  const handleSubmitExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);

    const { data, error } = await reportsService.exportReport({
      format: 'csv',
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate
        ? new Date(endDate + 'T23:59:59.999Z').toISOString()
        : undefined,
      limit,
    });

    setSubmitting(false);

    if (error || !data) {
      setSubmissionError(error || 'Não foi possível solicitar a exportação.');
      return;
    }

    const createdJobId = data.jobId || String(Date.now());
    setSubmissionSuccess({
      jobId: createdJobId,
      message: data.message,
    });

    const newJob: ReportJobItem = {
      jobId: createdJobId,
      requestedAt: new Date().toISOString(),
      status: 'PROCESSING',
    };

    setSessionJobs((prev) => {
      const updated = [newJob, ...prev];
      persistJobs(updated);
      return updated;
    });
  };

  // Download do arquivo CSV
  const handleDownloadFile = async (jobId: string, fileName?: string) => {
    if (!fileName) return;
    try {
      setDownloadingJobId(jobId);
      await downloadFromNotification(fileName);
    } finally {
      setDownloadingJobId(null);
    }
  };

  const handleClearSessionJobs = () => {
    setSessionJobs([]);
    persistJobs([]);
  };

  return (
    <div className="space-y-8">
      {/* 1. Cabeçalho Geral da Página */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
              <FileSpreadsheet className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Exportações & Relatórios
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Exportação & Relatórios Analíticos
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 max-w-3xl leading-relaxed">
            Exporte o histórico analítico de fretes e cotações da sua empresa em formato tabular. Seus relatórios são gerados em segundo plano para que você continue suas atividades sem interrupções.
          </p>
        </div>

        {/* Indicador de Atualização em Tempo Real */}
        <div className="flex items-center gap-2 self-start rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 shadow-xs sm:self-auto">
          <span className="relative flex size-2.5">
            {connectionStatus === 'connected' ? (
              <>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </>
            ) : connectionStatus === 'connecting' ? (
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-500 animate-pulse" />
            ) : (
              <span className="relative inline-flex size-2.5 rounded-full bg-zinc-400" />
            )}
          </span>
          <div className="text-xs">
            <span className="font-semibold text-zinc-900 block">Atualização em tempo real</span>
            <span className="text-zinc-500">
              {connectionStatus === 'connected'
                ? 'Conectado'
                : connectionStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cards de Valor para o Usuário */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Segundo Plano */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Clock className="size-5" />
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">
              Segundo Plano
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-950">
            Processamento em Segundo Plano
          </h3>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            Gere grandes volumes de dados sem travar sua navegação na plataforma.
          </p>
        </div>

        {/* Card 2: Compatibilidade */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="size-5" />
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              CSV / Excel
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-950">
            Compatível com Excel & Planilhas
          </h3>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            Arquivos em formato CSV com codificação UTF-8 e delimitador compatível com Excel e Google Sheets.
          </p>
        </div>

        {/* Card 3: Notificação */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <CheckCircle2 className="size-5" />
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Notificação
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-950">
            Aviso Instantâneo
          </h3>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            Você é notificado no sistema assim que o arquivo estiver disponível para download.
          </p>
        </div>
      </div>

      {/* 3. Formulário de Exportação */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Solicitar Novo Relatório de Fretes
            </h2>
            <p className="text-xs text-zinc-500">
              Defina o período e a quantidade de registros desejados para a exportação.
            </p>
          </div>
          {/* Botões de atalho rápido */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0">
            <span className="text-xs text-zinc-500 mr-1">Atalhos:</span>
            <button
              type="button"
              onClick={() => handleSetQuickDate(7)}
              className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(30)}
              className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={handleClearDates}
              className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              Limpar datas
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitExport} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Campo: Data Inicial */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Data Inicial (Opcional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-zinc-400" />
              </div>
            </div>

            {/* Campo: Data Final */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Data Final (Opcional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-zinc-400" />
              </div>
            </div>

            {/* Campo: Limite de Registros */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Limite de Linhas (Máx. 5.000)
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value={100}>100 registros (Rápido)</option>
                <option value={500}>500 registros</option>
                <option value={1000}>1.000 registros (Padrão)</option>
                <option value={5000}>5.000 registros (Carga Máxima)</option>
              </select>
            </div>
          </div>

          {/* Banner de Feedback HTTP 202 com Job ID */}
          {submissionSuccess && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 animate-in fade-in">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="flex-1 text-xs">
                <h4 className="font-semibold text-emerald-950">
                  Solicitação iniciada com sucesso! Protocolo #{submissionSuccess.jobId}.
                </h4>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  Seu arquivo está sendo gerado e você receberá uma notificação quando o download estiver liberado.
                </p>
              </div>
            </div>
          )}

          {/* Banner de Erro */}
          {submissionError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 animate-in fade-in">
              <AlertCircle className="size-5 shrink-0 text-red-600" />
              <div>
                <h4 className="font-semibold">Erro ao solicitar exportação</h4>
                <p className="mt-0.5">{submissionError}</p>
              </div>
            </div>
          )}

          {/* Rodapé do Formulário */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <HelpCircle className="size-4 text-zinc-400" />
              <span>O arquivo gerado é um CSV compatível com Microsoft Excel (BOM UTF-8 e delimitador ponto-e-vírgula).</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-amber-400 shadow-md hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Gerando solicitação...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Solicitar Exportação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Histórico de Relatórios da Sessão */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 flex items-center gap-2">
              <span>Histórico de Relatórios da Sessão</span>
              {sessionJobs.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {sessionJobs.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500">
              Acompanhe o andamento das solicitações recentes e baixe os arquivos prontos.
            </p>
          </div>

          {sessionJobs.length > 0 && (
            <button
              onClick={handleClearSessionJobs}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 transition cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Limpar lista</span>
            </button>
          )}
        </div>

        {/* Tabela de Relatórios */}
        <div className="mt-4 overflow-x-auto">
          {sessionJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3">
                <FileSpreadsheet className="size-6" />
              </span>
              <p className="text-sm font-medium text-zinc-800">
                Nenhum relatório solicitado nesta sessão
              </p>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                Use o formulário acima para solicitar uma exportação. O relatório será
                gerado em segundo plano e listado aqui em tempo real.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-700 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Protocolo</th>
                  <th className="px-4 py-3">Solicitado em</th>
                  <th className="px-4 py-3">Status do Processamento</th>
                  <th className="px-4 py-3">Total de Linhas</th>
                  <th className="px-4 py-3">Arquivo</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sessionJobs.map((job) => {
                  const isCompleted = job.status === 'COMPLETED';
                  const isProcessing = job.status === 'PROCESSING';

                  return (
                    <tr
                      key={job.jobId}
                      className="hover:bg-zinc-50/80 transition"
                    >
                      {/* Protocolo */}
                      <td className="px-4 py-3.5 font-mono font-medium text-zinc-900">
                        #{job.jobId}
                      </td>

                      {/* Data de Solicitação */}
                      <td className="px-4 py-3.5 text-zinc-600">
                        {new Date(job.requestedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-400/30">
                            <Loader2 className="size-3 animate-spin text-amber-600" />
                            Gerando arquivo...
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/30">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Pronto para download
                          </span>
                        )}
                        {job.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-400/30">
                            <AlertCircle className="size-3 text-red-600" />
                            Falha no processamento
                          </span>
                        )}
                      </td>

                      {/* Total de Linhas */}
                      <td className="px-4 py-3.5 font-medium text-zinc-800">
                        {isCompleted && typeof job.totalRecords === 'number'
                          ? `${job.totalRecords.toLocaleString('pt-BR')} registros`
                          : isProcessing
                            ? 'Processando...'
                            : '-'}
                      </td>

                      {/* Nome do Arquivo */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500">
                        {job.fileName || (isProcessing ? 'Gerando...' : '-')}
                      </td>

                      {/* Botão de Download */}
                      <td className="px-4 py-3.5 text-right">
                        {isCompleted && job.fileName ? (
                          <button
                            onClick={() =>
                              handleDownloadFile(job.jobId, job.fileName)
                            }
                            disabled={downloadingJobId === job.jobId}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-medium text-amber-400 shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
                          >
                            {downloadingJobId === job.jobId ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Baixando...</span>
                              </>
                            ) : (
                              <>
                                <Download className="size-3.5" />
                                <span>Baixar CSV</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">
                            Gerando arquivo...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
