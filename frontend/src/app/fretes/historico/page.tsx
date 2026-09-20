import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { FreightHistoryManagement } from '@/src/components/freight/history/FreightHistoryManagement';

export const metadata: Metadata = {
  title: 'Histórico & Auditoria de Fretes — LogiFlow',
  description: 'Histórico auditado de simulações, rotas, cubagens e cotações de transportadoras.',
};

export default function FreightHistoryPage() {
  return (
    <DashboardLayout>
      <FreightHistoryManagement />
    </DashboardLayout>
  );
}
