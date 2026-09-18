import {
  Controller, Post, Get, Body, Param, Res, HttpCode, HttpStatus, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Response } from 'express';
import * as fs from 'fs';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExportFreightReportDto } from '../dto/export-report.dto';
import { REPORTS_STORAGE_DIR } from './reports.constants';

@ApiTags('Freight Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('freight/reports')
export class FreightReportController {
  constructor(
    @InjectQueue('freight-reports')
    private readonly reportsQueue: Queue,
  ) { }

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Solicitar geração assíncrona de relatório de histórico de fretes',
    description:
      'Enfileira a exportação em background via BullMQ. O frontend será avisado via SSE assim que o arquivo estiver disponível.',
  })
  async exportReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ExportFreightReportDto,
  ) {
    const job = await this.reportsQueue.add(
      'generate-report',
      {
        tenantId,
        userId,
        ...dto,
      },
      {
        removeOnComplete: 100, // mantém os últimos 100 jobs no redis para histórico
        removeOnFail: 50,
        attempts: 2,
      },
    );

    return {
      jobId: job.id,
      status: 'PROCESSING',
      message:
        'A geração do relatório foi enfileirada com sucesso. Você será notificado em tempo real quando estiver pronto.',
    };
  }

  @Get('download/:fileName')
  @Roles(Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({
    summary: 'Fazer download de um relatório CSV gerado pelo worker',
  })
  @ApiParam({
    name: 'fileName',
    description: 'Nome do arquivo retornado na notificação',
  })
  downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    // Sanitiza o nome do arquivo prevenindo path traversal
    const safeName = fileName.replace(/[/\\]/g, '');
    const filePath = `${REPORTS_STORAGE_DIR}/${safeName}`;

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        'Arquivo de relatório não encontrado ou expirado.',
      );
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
