import { authService } from './auth';
import { carriersService } from './carriers';
import type { DashboardData, Quote, Carrier } from '@/src/types';

export const dashboardService = {
  getData: async (): Promise<DashboardData | null> => {
    const [user, company, carriersList] = await Promise.all([
      authService.getCurrentUser(),
      authService.getCompanyInfo(),
      carriersService.list().catch(() => [] as Carrier[]),
    ]);

    const activeCarriers = carriersList.filter((c) => c.status === 'ACTIVE');

    return {
      company,
      user,
      metrics: {
        quotesCount: 0,
        averageCost: 0,
        cubageAppliedPercent: 0,
        activePartnersCount: activeCarriers.length,
      },
      chartSeries: [],
      recentQuotes: [],
      topCarriers: activeCarriers.slice(0, 5).map((c) => ({
        carrierId: c.id,
        carrierName: c.name,
        percentage: 100 / (activeCarriers.length || 1),
        formattedPercentage: `${Math.round(100 / (activeCarriers.length || 1))}%`,
      })),
    };
  },

  getRecentQuotes: async (_limit: number = 10): Promise<Quote[]> => {
    return [];
  },
};
