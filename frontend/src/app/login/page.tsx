import { Metadata } from 'next';
import { AuthContainer } from '@/src/components/auth/AuthContainer';

export const metadata: Metadata = {
  title: 'Acesse sua empresa — LogiFlow',
  description: 'Entre para consultar cotações, parceiros e a operação logística corporativa da sua empresa.',
};

export default function LoginPage() {
  return <AuthContainer initialTab="login" />;
}
