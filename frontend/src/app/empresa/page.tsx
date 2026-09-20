import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { CompanyManagement } from '@/src/components/company/CompanyManagement';

export const metadata: Metadata = {
  title: 'Configurações da Empresa & Equipe — LogiFlow',
  description: 'Gerencie as configurações da sua empresa, dados cadastrais e permissões de acesso da equipe.',
};

export default function EmpresaPage() {
  return (
    <DashboardLayout>
      <CompanyManagement />
    </DashboardLayout>
  );
}
