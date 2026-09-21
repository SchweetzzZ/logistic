import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { ReportsManagement } from '@/src/components/reports/ReportsManagement';

// Metadados da página de Relatórios
export const metadata: Metadata = {
  title: 'Exportação & Relatórios Analíticos — LogiFlow',
  description:
    'Exportação de relatórios analíticos de frete e auditoria logística.',
};

export default function RelatoriosPage() {
  return (
    <DashboardLayout>
      <ReportsManagement />
    </DashboardLayout>
  );
}
