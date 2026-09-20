import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { FreightSimulation } from '@/src/components/freight/FreightSimulation';

export const metadata: Metadata = {
  title: 'Simulação de Frete — LogiFlow',
  description:
    'Simulador multi-transportadora em tempo real com cálculo de cubagem e auditoria.',
};

function SimulationLoadingFallback() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium text-zinc-600">
          Carregando simulador de frete...
        </p>
      </div>
    </div>
  );
}

export default function SimularFretePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<SimulationLoadingFallback />}>
        <FreightSimulation />
      </Suspense>
    </DashboardLayout>
  );
}
