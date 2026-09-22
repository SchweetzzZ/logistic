import { redirect } from 'next/navigation';

// Redireciona rota legada /simular-frete para a rota oficial /fretes/simular
export default function SimularFreteRedirectPage() {
  redirect('/fretes/simular');
}
