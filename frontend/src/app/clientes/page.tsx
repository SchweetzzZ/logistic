import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { CustomersManagement } from '@/src/components/customers/CustomersManagement';

export const metadata: Metadata = {
  title: 'Clientes — LogiFlow',
  description: 'Gestão e cadastro de clientes e destinatários corporativos.',
};

export default function ClientesPage() {
  return (
    <DashboardLayout>
      <CustomersManagement />
    </DashboardLayout>
  );
}
