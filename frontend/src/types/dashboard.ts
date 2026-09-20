import type { CompanyInfo, UserProfile } from './auth';

export interface MetricData {
  label: string;
  value: string | number;
  detail?: string;
  positive?: boolean | null;
  key: 'quotes_count' | 'average_cost' | 'cubage_rate' | 'active_partners';
}

export interface Quote {
  id: string;
  origin?: string;
  destination?: string;
  route: string;
  carrierName: string;
  value: number;
  formattedValue: string;
  deadlineDays: number;
  formattedDeadline: string;
  createdAt: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CarrierShare {
  carrierId: string;
  carrierName: string;
  percentage: number;
  formattedPercentage: string;
  quotesCount?: number;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  quotesCount: number;
}

export interface DashboardData {
  company: CompanyInfo | null;
  user: UserProfile | null;
  metrics: {
    quotesCount: number;
    quotesGrowthPercent?: number;
    averageCost: number;
    averageCostGrowthPercent?: number;
    cubageAppliedPercent: number;
    cubageQuotesCount?: number;
    activePartnersCount: number;
  };
  chartSeries: ChartDataPoint[];
  recentQuotes: Quote[];
  topCarriers: CarrierShare[];
  insight?: {
    title: string;
    description: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null;
}
