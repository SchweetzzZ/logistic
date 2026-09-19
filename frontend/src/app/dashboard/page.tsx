import { Dashboard } from '@/src/components/dashboard/Dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — LogiFlow',
  description: 'Visão geral da operação, cotações de fretes e indicadores de logística.',
};

export default function DashboardPage() {
  return <Dashboard />;
}
