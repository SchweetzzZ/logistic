import { authService } from './auth';
import { carriersService } from './carriers';
import { freightService } from './freight';
import type { DashboardData, Quote, Carrier, CarrierShare, ChartDataPoint, FreightHistoryItem } from '@/src/types';

// Função utilitária para mapear um item de histórico para o formato de cotação do dashboard
function mapHistoryItemToQuote(item: FreightHistoryItem): Quote {
  const priceNum = parseFloat(item.cheapestPrice || '0');
  const deadlineDays = item.cheapestDeadlineDays || 0;
  const origin = item.originCity
    ? `${item.originCity}/${item.originState}`
    : item.originZipCode;
  const destination = item.destinationCity
    ? `${item.destinationCity}/${item.destinationState}`
    : item.destinationZipCode;

  return {
    id: item.id,
    origin,
    destination,
    route: `${item.originCity || 'Origem'} ➔ ${item.destinationCity || 'Destino'}`,
    carrierName: item.cheapestCarrierName || 'Transportadora',
    value: priceNum,
    formattedValue: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceNum),
    deadlineDays,
    formattedDeadline: `${deadlineDays} dias úteis`,
    createdAt: item.createdAt,
    status: 'completed',
  };
}

export const dashboardService = {
  getData: async (): Promise<DashboardData | null> => {
    // Busca concorrente de usuário, empresa, transportadoras e histórico de fretes
    const [user, company, carriersList, historyRes] = await Promise.all([
      authService.getCurrentUser(),
      authService.getCompanyInfo(),
      carriersService.list().catch(() => [] as Carrier[]),
      freightService.getHistory(1, 100).catch(() => ({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      })),
    ]);

    const activeCarriers = carriersList.filter((c) => c.status === 'ACTIVE');
    const activePartnersCount = activeCarriers.length;

    // Métricas calculadas a partir do histórico real
    const quotesCount = historyRes.total || 0;

    const validPrices = historyRes.data
      .map((item) => parseFloat(item.cheapestPrice || '0'))
      .filter((price) => !isNaN(price) && price > 0);

    const averageCost =
      validPrices.length > 0
        ? validPrices.reduce((sum, val) => sum + val, 0) / validPrices.length
        : 0;

    const cubageQuotesCount = historyRes.data.filter(
      (item) =>
        parseFloat(item.volumetricWeightKg || '0') >
        parseFloat(item.actualWeightKg || '0'),
    ).length;

    const cubageAppliedPercent =
      historyRes.data.length > 0
        ? Math.round((cubageQuotesCount / historyRes.data.length) * 100)
        : 0;

    // Cotações recentes (5 primeiras do histórico)
    const recentQuotes: Quote[] = historyRes.data
      .slice(0, 5)
      .map(mapHistoryItemToQuote);

    // Participação das transportadoras vencedoras
    const carrierWinCounts: Record<
      string,
      { carrierId: string; carrierName: string; count: number }
    > = {};
    let totalWinningQuotes = 0;

    for (const item of historyRes.data) {
      if (item.cheapestCarrierName) {
        const key = item.cheapestCarrierId || item.cheapestCarrierName;
        if (!carrierWinCounts[key]) {
          carrierWinCounts[key] = {
            carrierId: item.cheapestCarrierId || key,
            carrierName: item.cheapestCarrierName,
            count: 0,
          };
        }
        carrierWinCounts[key].count += 1;
        totalWinningQuotes += 1;
      }
    }

    let topCarriers: CarrierShare[] = [];
    if (totalWinningQuotes > 0) {
      topCarriers = Object.values(carrierWinCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((c) => {
          const percentage = Math.round((c.count / totalWinningQuotes) * 100);
          return {
            carrierId: c.carrierId,
            carrierName: c.carrierName,
            quotesCount: c.count,
            percentage,
            formattedPercentage: `${percentage}%`,
          };
        });
    } else if (activeCarriers.length > 0) {
      topCarriers = activeCarriers.slice(0, 5).map((c) => ({
        carrierId: c.id,
        carrierName: c.name,
        quotesCount: 0,
        percentage: 0,
        formattedPercentage: '0%',
      }));
    }

    // Agrupamento temporal das cotações por dia para a série do gráfico
    let chartSeries: ChartDataPoint[] = [];
    if (historyRes.data.length > 0) {
      const countsByDay: Record<string, number> = {};
      for (const item of historyRes.data) {
        if (item.createdAt) {
          // Normaliza a data para formato YYYY-MM-DD
          const raw = String(item.createdAt);
          const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
          const dateKey = match ? match[1] : raw.slice(0, 10);
          countsByDay[dateKey] = (countsByDay[dateKey] || 0) + 1;
        }
      }

      // Constrói janela de 7 dias terminando na data atual no fuso horário local
      const now = new Date();
      const last7DaysKeys = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });

      const hasQuotesInLast7Days = last7DaysKeys.some(
        (k) => (countsByDay[k] || 0) > 0,
      );

      if (hasQuotesInLast7Days) {
        chartSeries = last7DaysKeys.map((dateStr) => {
          const parts = dateStr.split('-');
          const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
          return {
            date: dateStr,
            label,
            quotesCount: countsByDay[dateStr] || 0,
          };
        });
      } else {
        // Usa as datas reais do histórico em ordem cronológica se não houver nos últimos 7 dias
        const sortedDates = Object.keys(countsByDay).sort();
        const displayDates = sortedDates.slice(-7);
        chartSeries = displayDates.map((dateStr) => {
          const parts = dateStr.split('-');
          const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
          return {
            date: dateStr,
            label,
            quotesCount: countsByDay[dateStr] || 0,
          };
        });
      }
    }

    // Insight dinâmico baseado na operação real
    const insight =
      cubageQuotesCount > 0
        ? {
          title: 'Otimização de Cubagem Ativa',
          description: `${cubageAppliedPercent}% das cotações recentes tiveram aplicação de peso cubado. Avalie o fator de cubagem de suas transportadoras parceiras.`,
          actionUrl: '/fretes/historico',
          actionLabel: 'Ver histórico detalhado',
        }
        : {
          title: 'Controle Operacional Ativo',
          description:
            'O motor LogiFlow monitora parâmetros de cubagem e regras contratuais em cada cotação para garantir a melhor decisão de frete.',
          actionUrl: '/fretes/historico',
          actionLabel: 'Ver histórico de cotações',
        };

    return {
      company,
      user,
      metrics: {
        quotesCount,
        averageCost,
        cubageAppliedPercent,
        cubageQuotesCount,
        activePartnersCount,
      },
      chartSeries,
      recentQuotes,
      topCarriers,
      insight,
    };
  },

  getRecentQuotes: async (limit: number = 10): Promise<Quote[]> => {
    const historyRes = await freightService
      .getHistory(1, limit)
      .catch(() => ({
        data: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      }));

    return historyRes.data.map(mapHistoryItemToQuote);
  },
};
