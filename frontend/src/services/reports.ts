// Serviço para solicitação e download de relatórios assíncronos

import { rawClient } from './api';
import type { ExportFreightReportDto, ExportReportResponse } from '@/src/types';
import { API_BASE_URL } from '@/src/config/api.config';

export const reportsService = {
  // Solicita ao backend o enfileiramento assíncrono da geração de relatório via BullMQ
  exportReport: async (dto: ExportFreightReportDto): Promise<{ data?: ExportReportResponse; error?: string }> => {
    try {
      const { data, error } = await rawClient.POST('/freight/reports/export', {
        body: {
          format: dto.format || 'csv',
          startDate: dto.startDate,
          endDate: dto.endDate,
          limit: dto.limit ?? 1000,
        },
      });

      if (error) {
        let msg = 'Falha ao solicitar geração do relatório.';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          msg = Array.isArray(m) ? m.join(', ') : String(m);
        }
        return { error: msg };
      }

      return { data: data as unknown as ExportReportResponse };
    } catch (err: unknown) {
      return {
        error:
          (err instanceof Error ? err.message : null) ||
          'Erro inesperado ao conectar com o serviço de relatórios.',
      };
    }
  },

  // Realiza o download seguro do arquivo CSV via fetch autenticado com Blob, com fallback para link direto
  downloadReport: async (fileName: string): Promise<boolean> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

    const safeFileName = fileName.replace(/[/\\]/g, '');
    const directUrl = `${API_BASE_URL}/freight/reports/download/${encodeURIComponent(safeFileName)}`;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(directUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      return true;
    } catch (fetchError) {
      console.warn(
        'Falha no download via Blob autenticado, usando fallback com query token:',
        fetchError,
      );
      // Fallback para abertura direta com token na query string
      const fallbackUrl = token
        ? `${directUrl}?token=${encodeURIComponent(token)}`
        : directUrl;
      window.open(fallbackUrl, '_blank');
      return true;
    }
  },
};
