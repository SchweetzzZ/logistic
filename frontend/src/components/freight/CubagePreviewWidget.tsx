'use client';

import React from 'react';
import { Box, Scale, ArrowRight, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface CubagePreviewWidgetProps {
  length: number;
  width: number;
  height: number;
  actualWeight: number;
}

export function CubagePreviewWidget({
  length,
  width,
  height,
  actualWeight,
}: CubagePreviewWidgetProps) {
  const safeLength = Number.isFinite(length) && length > 0 ? length : 0;
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;
  const safeWeight = Number.isFinite(actualWeight) && actualWeight > 0 ? actualWeight : 0;

  const volumeCm3 = safeLength * safeWidth * safeHeight;
  const volumetricWeight = volumeCm3 > 0 ? Number((volumeCm3 / 6000).toFixed(2)) : 0;
  const chargedWeight = Math.max(safeWeight, volumetricWeight);
  const isCubageCharged = volumetricWeight > safeWeight;
  const hasData = safeWeight > 0 || volumeCm3 > 0;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 transition-all">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
            <Scale className="size-4" />
          </span>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Cálculo de Cubagem em Tempo Real
          </h4>
        </div>
        <span className="text-[11px] font-medium text-zinc-500">
          Fator Padrão: 6.000 cm³/kg
        </span>
      </div>

      {/* Visual Formula */}
      <div className="my-3 rounded-xl bg-white p-3 border border-zinc-200/60 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
          <span className="font-mono text-zinc-500">Fórmula de Cubagem:</span>
          <span className="font-mono font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
            (C × L × A) ÷ 6.000
          </span>
        </div>

        <div className="mt-2 text-xs text-zinc-700 font-mono bg-zinc-50 rounded-lg p-2 flex items-center justify-between flex-wrap gap-1">
          <span>
            ({safeLength || 0} × {safeWidth || 0} × {safeHeight || 0}) ÷ 6.000
          </span>
          <span className="text-zinc-400">=</span>
          <span className="font-bold text-amber-700">
            {volumetricWeight.toFixed(2)} kg volumétricos
          </span>
        </div>
      </div>

      {/* Comparativo Real vs Volumétrico */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        {/* Peso Real */}
        <div
          className={`rounded-xl p-3 border transition-all ${
            hasData && !isCubageCharged && safeWeight > 0
              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300/60'
              : 'bg-white border-zinc-200/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">Peso Físico Real</span>
            {hasData && !isCubageCharged && safeWeight > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <CheckCircle2 className="size-2.5" /> Cobrado
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold text-zinc-900">{safeWeight.toFixed(2)}</span>
            <span className="text-xs text-zinc-500">kg</span>
          </div>
        </div>

        {/* Peso Cubado */}
        <div
          className={`rounded-xl p-3 border transition-all ${
            hasData && isCubageCharged
              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/60'
              : 'bg-white border-zinc-200/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500">Peso Cubado</span>
            {hasData && isCubageCharged && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                <AlertTriangle className="size-2.5" /> Cobrado
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold text-zinc-900">
              {volumetricWeight.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500">kg</span>
          </div>
        </div>
      </div>

      {/* Regra de Cobrança / Resultado Final */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-800">
              Peso Faturado (Base de Cálculo):
            </span>
          </div>
          <span className="text-sm font-bold text-zinc-950 bg-amber-100/70 px-2 py-0.5 rounded-md">
            {chargedWeight.toFixed(2)} kg
          </span>
        </div>

        <div className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          {!hasData ? (
            <span className="flex items-center gap-1 text-zinc-400">
              <Info className="size-3 shrink-0" />
              Preencha o peso e as dimensões acima para ver o peso a ser cobrado.
            </span>
          ) : isCubageCharged ? (
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <AlertTriangle className="size-3 shrink-0" />
              Cubagem aplicada: o peso volumétrico superou o peso físico real da encomenda.
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="size-3 shrink-0" />
              Cobrança por peso físico: o peso real superou o volume cúbico calculado.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
