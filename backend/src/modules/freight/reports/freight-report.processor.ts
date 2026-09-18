import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import * as fs from 'fs';
import { DRIZZLE, type DrizzleDB } from '../../database/database.constants';
import { auditFreightSchema, type AuditFreight } from '../schemas/schema';
import { SseNotificationService } from '../../notification/sse-notification.service';
import { REPORTS_STORAGE_DIR } from './reports.constants';

export interface FreightReportJobData {
  tenantId: string;
  userId: string;
  format?: 'csv';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

@Processor('freight-reports')
export class FreightReportProcessor extends WorkerHost {
  private readonly logger = new Logger(FreightReportProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly sseService: SseNotificationService,
  ) {
    super();
    // Garante que o diretório de relatórios exista
    if (!fs.existsSync(REPORTS_STORAGE_DIR)) {
      fs.mkdirSync(REPORTS_STORAGE_DIR, { recursive: true });
    }
  }

  async process(job: Job<FreightReportJobData>): Promise<{ filePath: string; totalRecords: number }> {
    this.logger.log(
      `Iniciando processamento do Job ${job.id} para tenant ${job.data.tenantId}`,
    );

    const { tenantId, userId, startDate, endDate, limit = 1000 } = job.data;

    // Constrói os filtros de consulta
    const conditions = [eq(auditFreightSchema.tenantId, tenantId)];
    if (startDate) {
      conditions.push(gte(auditFreightSchema.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(auditFreightSchema.createdAt, endDate));
    }

    // Busca os dados no MySQL através do Drizzle
    const records = await this.db.select().from(auditFreightSchema)
      .where(and(...conditions))
      .orderBy(desc(auditFreightSchema.createdAt))
      .limit(limit);

    this.logger.log(`Coletados ${records.length} registros para o relatório.`);

    // Gera o conteúdo CSV com delimitador ';' e BOM UTF-8 para suporte nativo ao Excel
    const csvContent = this.generateCsv(records);

    const fileName = `relatorio-fretes-${job.id}.csv`;
    const filePath = `${REPORTS_STORAGE_DIR}/${fileName}`;

    // Grava o arquivo no disco local
    fs.writeFileSync(filePath, csvContent, { encoding: 'utf-8' });
    this.logger.log(`Relatório salvo em: ${filePath}`);

    // Emite evento em tempo real via SSE informando conclusão
    const downloadUrl = `/freight/reports/download/${fileName}`;
    this.sseService.sendToUser(userId, 'REPORT_READY', {
      jobId: job.id,
      fileName,
      downloadUrl,
      totalRecords: records.length,
      message: `Seu relatório com ${records.length} simulações está pronto para download!`,
    });

    return { filePath, totalRecords: records.length };
  }

  /**
   * Converte a lista de auditorias em uma string CSV formatada
   */
  private generateCsv(records: AuditFreight[]): string {
    const headers = [
      'ID',
      'Data/Hora',
      'CEP Origem',
      'Cidade/UF Origem',
      'CEP Destino',
      'Cidade/UF Destino',
      'Peso Real (kg)',
      'Peso Cubado (kg)',
      'Peso Cobrado (kg)',
      'Valor Declarado (R$)',
      'Tipo Entrega',
      'Melhor Transportadora',
      'Menor Preço (R$)',
      'Prazo (dias)',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val == null) return '';
      const str = typeof val === 'string' ? val : JSON.stringify(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.createdAt),
      escapeCsv(r.originZipCode),
      escapeCsv(`${r.originCity || ''}/${r.originState || ''}`),
      escapeCsv(r.destinationZipCode),
      escapeCsv(`${r.destinationCity || ''}/${r.destinationState || ''}`),
      escapeCsv(r.actualWeightKg),
      escapeCsv(r.volumetricWeightKg),
      escapeCsv(r.chargedWeightKg),
      escapeCsv(r.declaredValue),
      escapeCsv(r.deliveryType),
      escapeCsv(r.cheapestCarrierName || 'N/A'),
      escapeCsv(r.cheapestPrice || '0.00'),
      escapeCsv(r.cheapestDeadlineDays ?? 'N/A'),
    ]);

    // \uFEFF = BOM UTF-8 para compatibilidade com Excel
    const lines = [headers.join(';'), ...rows.map((row) => row.join(';'))];
    return '\uFEFF' + lines.join('\r\n');
  }
}
