'use client';

import React, { useState } from 'react';
import {
  Truck,
  Clock,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { FreightQuote } from '@/src/types';

export interface FreightQuoteCardProps {
  quote: FreightQuote;
  routeInfo?: {
    originCity?: string;
    originState?: string;
    destinationCity?: string;
    destinationState?: string;
  };
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function FreightQuoteCard({
  quote,
  routeInfo,
}: FreightQuoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { breakdown } = quote;

  const handleCopySummary = async () => {
    const routeText =
      routeInfo?.originCity && routeInfo?.destinationCity
        ? `Rota: ${routeInfo.originCity}/${routeInfo.originState} ➔ ${routeInfo.destinationCity}/${routeInfo.destinationState}\n`
        : '';

    const summaryText = `🚚 LogiFlow — Cotação de Frete
${routeText}Transportadora: ${quote.carrierName}
Valor Total: ${formatBRL(quote.totalPrice)}
Prazo Estimado: ${quote.deadlineDays} ${quote.deadlineDays === 1 ? 'dia útil' : 'dias úteis'}

Composição dos Custos:
• Preço Base: ${formatBRL(breakdown.basePrice)}
• Custo por Peso: ${formatBRL(breakdown.weightCost)} (${formatBRL(breakdown.pricePerKg)}/kg × ${breakdown.chargedWeightKg} kg cobrados)
• Multiplicador de Distância: ${breakdown.distanceMultiplier}x
• Subtotal Frete: ${formatBRL(breakdown.shippingSubtotal)}
• Seguro (Ad-valorem): ${formatBRL(breakdown.insuranceCost)}
`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // Falha silenciosa no clipboard
    }
  };

  const getDistanceLabel = (multiplier: number) => {
    if (multiplier <= 1.0) return '1.0x (Entrega Local)';
    if (multiplier <= 1.25) return '1.25x (Entrega Estadual)';
    return `${multiplier}x (Entrega Interestadual)`;
  };

  return (
    <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
            <Truck className="size-4" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">{quote.carrierName}</h3>
        </div>
      </div>

      {/* Main Info: Price & Deadline */}
      <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-between bg-zinc-50/70 p-4 rounded-xl border border-zinc-100">
        <div>
          <span className="block text-xs font-medium text-zinc-500">Valor Final do Frete</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-950">
              {formatBRL(quote.totalPrice)}
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="block text-xs font-medium text-zinc-500">Prazo de Entrega</span>
          <div className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-800">
            <Clock className="size-4 text-amber-500" />
            <span>
              {quote.deadlineDays} {quote.deadlineDays === 1 ? 'dia útil' : 'dias úteis'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions: Copiar & Accordion Toggle */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopySummary}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            isCopied
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
          title="Copiar resumo para área de transferência"
        >
          {isCopied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span>Resumo Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-zinc-500" />
              <span>Copiar Resumo</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
        >
          <span>{isExpanded ? 'Ocultar Composição' : 'Ver Composição'}</span>
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-amber-500' : 'text-zinc-400'
            }`}
          />
        </button>
      </div>

      {/* Collapsible Breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-zinc-100 animate-in fade-in duration-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
            Detalhamento da Tarifa
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-600">Preço Base de Saída:</span>
              <span className="font-semibold text-zinc-900">
                {formatBRL(breakdown.basePrice)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <div>
                <span className="text-zinc-600">Custo por Peso:</span>
                <span className="block text-[10px] text-zinc-400">
                  {formatBRL(breakdown.pricePerKg)}/kg × {breakdown.chargedWeightKg} kg cobrados
                </span>
              </div>
              <span className="font-semibold text-zinc-900">
                {formatBRL(breakdown.weightCost)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <div>
                <span className="text-zinc-600">Fator de Distância:</span>
                <span className="block text-[10px] text-zinc-400">
                  {getDistanceLabel(breakdown.distanceMultiplier)}
                </span>
              </div>
              <span className="font-semibold text-zinc-900">
                {breakdown.distanceMultiplier}x
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100 bg-zinc-50/60 px-2 rounded-md">
              <span className="font-medium text-zinc-700">Subtotal de Transporte:</span>
              <span className="font-bold text-zinc-900">
                {formatBRL(breakdown.shippingSubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <div>
                <span className="text-zinc-600">Seguro / Ad-Valorem:</span>
                <span className="block text-[10px] text-zinc-400">
                  0,5% sobre o valor declarado
                </span>
              </div>
              <span className="font-semibold text-zinc-900">
                {formatBRL(breakdown.insuranceCost)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 font-bold text-zinc-950">
              <span>Total Calculado:</span>
              <span className="text-sm text-zinc-950">{formatBRL(quote.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
