// Tipos para exportação assíncrona e relatórios do sistema

export interface ExportFreightReportDto {
  startDate?: string;
  endDate?: string;
  limit?: number;
  format?: 'csv';
}

export interface ExportReportResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface ReportJobItem {
  jobId: string;
  requestedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName?: string;
  downloadUrl?: string;
  totalRecords?: number;
}

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}
