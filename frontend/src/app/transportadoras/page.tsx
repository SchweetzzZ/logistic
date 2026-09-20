import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { CarriersManagement } from '@/src/components/carriers/CarriersManagement';

export const metadata: Metadata = {
  title: 'Transportadoras — LogiFlow',
  description: 'Gestão de parceiros de frete, taxas e prazos operacionais.',
};

export default function TransportadorasPage() {
  return (
    <DashboardLayout>
      <CarriersManagement />
    </DashboardLayout>
  );
}
