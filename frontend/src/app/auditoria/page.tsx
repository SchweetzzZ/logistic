import type { Metadata } from 'next';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { AuditManagement } from '@/src/components/audit/AuditManagement';

export const metadata: Metadata = {
  title: 'Auditoria do Sistema — LogiFlow',
  description: 'Trilha de auditoria, registros de acessos, eventos de segurança e alterações no sistema.',
};

export default function AuditoriaPage() {
  return (
    <DashboardLayout>
      <AuditManagement />
    </DashboardLayout>
  );
}
