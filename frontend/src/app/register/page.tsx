import { Metadata } from 'next';
import { AuthContainer } from '@/src/components/auth/AuthContainer';

export const metadata: Metadata = {
  title: 'Cadastrar empresa — LogiFlow',
  description: 'Configure um ambiente dedicado para sua equipe gerenciar fretes, despachos e auditoria.',
};

export default function RegisterPage() {
  return <AuthContainer initialTab="register" />;
}
