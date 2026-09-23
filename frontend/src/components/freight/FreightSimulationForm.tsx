'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  MapPin,
  Package,
  Mail,
  Scale,
  UsersRound,
  DollarSign,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Truck,
  ChevronDown,
} from 'lucide-react';
import { Carrier, Customer, SimulateFreightInput } from '@/src/types';
import { carriersService, customersService } from '@/src/services';
import { CubagePreviewWidget } from './CubagePreviewWidget';

export interface FreightSimulationFormProps {
  onSubmit: (payload: SimulateFreightInput) => Promise<void>;
  isLoading?: boolean;
}

export function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

interface PresetOption {
  id: string;
  name: string;
  dimensions: { length: number; width: number; height: number };
  weight: number;
  icon: typeof Package;
  subtitle: string;
}

const PRESETS: PresetOption[] = [
  {
    id: 'caixa-p',
    name: 'Caixa P',
    dimensions: { length: 16, width: 11, height: 6 },
    weight: 0.5,
    icon: Package,
    subtitle: '16×11×6 cm • 0.5 kg',
  },
  {
    id: 'caixa-m',
    name: 'Caixa M',
    dimensions: { length: 25, width: 20, height: 15 },
    weight: 2.0,
    icon: Package,
    subtitle: '25×20×15 cm • 2.0 kg',
  },
  {
    id: 'caixa-g',
    name: 'Caixa G',
    dimensions: { length: 40, width: 35, height: 30 },
    weight: 5.0,
    icon: Package,
    subtitle: '40×35×30 cm • 5.0 kg',
  },
  {
    id: 'envelope-a4',
    name: 'Envelope A4',
    dimensions: { length: 30, width: 22, height: 2 },
    weight: 0.2,
    icon: Mail,
    subtitle: '30×22×2 cm • 0.2 kg',
  },
];

export function FreightSimulationForm({
  onSubmit,
  isLoading = false,
}: FreightSimulationFormProps) {
  const searchParams = useSearchParams();

  // Estados dos Campos
  const [originZipCode, setOriginZipCode] = useState('01001-000');
  const [destinationZipCode, setDestinationZipCode] = useState('');
  const [weight, setWeight] = useState<string>('1.0');
  const [length, setLength] = useState<string>('20');
  const [width, setWidth] = useState<string>('15');
  const [height, setHeight] = useState<string>('10');
  const [declaredValue, setDeclaredValue] = useState<string>('100');

  // Clientes para seleção rápida
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Transportadoras para seleção rápida / filtro
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
  const [loadingCarriers, setLoadingCarriers] = useState(false);

  // Erros de Validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Carrega clientes para o dropdown de destinatários
  useEffect(() => {
    let isMounted = true;
    async function loadCustomersList() {
      try {
        setLoadingCustomers(true);
        const data = await customersService.list();
        if (isMounted) {
          // Filtra clientes que possuem CEP cadastrado preferencialmente
          setCustomers(data);
        }
      } catch {
        // Falha silenciosa
      } finally {
        if (isMounted) {
          setLoadingCustomers(false);
        }
      }
    }
    loadCustomersList();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega transportadoras ativas para o dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadCarriersList() {
      try {
        setLoadingCarriers(true);
        const data = await carriersService.list();
        if (isMounted) {
          setCarriers(data.filter((c) => c.status === 'ACTIVE'));
        }
      } catch {
        // Falha silenciosa
      } finally {
        if (isMounted) {
          setLoadingCarriers(false);
        }
      }
    }
    loadCarriersList();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lê parâmetros de URL (Repetir Simulação / Deep links)
  useEffect(() => {
    if (!searchParams) return;

    const originParam =
      searchParams.get('originZipCode') ||
      searchParams.get('originZip') ||
      searchParams.get('origin');
    const destinationParam =
      searchParams.get('destinationZipCode') ||
      searchParams.get('destinationZip') ||
      searchParams.get('destination');
    const weightParam =
      searchParams.get('weight') || searchParams.get('actualWeight');
    const lengthParam =
      searchParams.get('length') || searchParams.get('dimensionsLength') || searchParams.get('l');
    const widthParam =
      searchParams.get('width') || searchParams.get('dimensionsWidth') || searchParams.get('w');
    const heightParam =
      searchParams.get('height') || searchParams.get('dimensionsHeight') || searchParams.get('h');
    const declaredValueParam =
      searchParams.get('declaredValue') || searchParams.get('value');
    const carrierIdParam =
      searchParams.get('carrierId') || searchParams.get('carrier');

    if (originParam) setOriginZipCode(formatCEP(originParam));
    if (destinationParam) setDestinationZipCode(formatCEP(destinationParam));
    if (weightParam) setWeight(weightParam);
    if (lengthParam) setLength(lengthParam);
    if (widthParam) setWidth(widthParam);
    if (heightParam) setHeight(heightParam);
    if (declaredValueParam) setDeclaredValue(declaredValueParam);
    if (carrierIdParam) setSelectedCarrierId(carrierIdParam);
  }, [searchParams]);

  // Aplica predefinição de pacote
  const handleApplyPreset = (preset: PresetOption) => {
    setActivePreset(preset.id);
    setLength(String(preset.dimensions.length));
    setWidth(String(preset.dimensions.width));
    setHeight(String(preset.dimensions.height));
    setWeight(String(preset.weight));
  };

  // Ao selecionar um cliente cadastrado
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer?.zipCode) {
      setDestinationZipCode(formatCEP(customer.zipCode));
      if (formErrors.destinationZipCode) {
        setFormErrors((prev) => ({ ...prev, destinationZipCode: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanOrigin = originZipCode.replace(/\D/g, '');
    const cleanDestination = destinationZipCode.replace(/\D/g, '');

    if (cleanOrigin.length !== 8) {
      errors.originZipCode = 'CEP de origem deve conter 8 dígitos.';
    }

    if (cleanDestination.length !== 8) {
      errors.destinationZipCode = 'CEP de destino deve conter 8 dígitos.';
    }

    const weightNum = parseFloat(weight.replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.weight = 'O peso real deve ser maior que 0 kg.';
    }

    const lengthNum = parseFloat(length.replace(',', '.'));
    const widthNum = parseFloat(width.replace(',', '.'));
    const heightNum = parseFloat(height.replace(',', '.'));

    if (isNaN(lengthNum) || lengthNum <= 0) {
      errors.length = 'Informe o comprimento (cm).';
    }
    if (isNaN(widthNum) || widthNum <= 0) {
      errors.width = 'Informe a largura (cm).';
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      errors.height = 'Informe a altura (cm).';
    }

    const declaredValNum = parseFloat(declaredValue.replace(',', '.')) || 0;
    if (declaredValNum < 0) {
      errors.declaredValue = 'Valor declarado não pode ser negativo.';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await onSubmit({
      originZipCode: cleanOrigin,
      destinationZipCode: cleanDestination,
      weight: weightNum,
      dimensions: {
        length: lengthNum,
        width: widthNum,
        height: heightNum,
      },
      declaredValue: declaredValNum,
      carrierId: selectedCarrierId || undefined,
    });
  };

  // Transportadora selecionada para personalizar o botão de envio
  const selectedCarrier = carriers.find((c) => c.id === selectedCarrierId);
  const submitButtonText = selectedCarrier
    ? `Calcular Frete com ${selectedCarrier.name}`
    : 'Calcular e Comparar Fretes';

  // Valores numéricos para o widget de cubagem
  const numericLength = parseFloat(length.replace(',', '.')) || 0;
  const numericWidth = parseFloat(width.replace(',', '.')) || 0;
  const numericHeight = parseFloat(height.replace(',', '.')) || 0;
  const numericWeight = parseFloat(weight.replace(',', '.')) || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 0: Seleção de Transportadora */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
              <Truck className="size-4 text-amber-500" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950">Transportadora</h3>
          </div>
        </div>

        <div>
          <label
            htmlFor="carrier-select"
            className="block text-xs font-semibold text-zinc-700 mb-1.5"
          >
            Transportadora disponível
          </label>
          <div className="relative">
            <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <select
              id="carrier-select"
              value={selectedCarrierId}
              onChange={(e) => setSelectedCarrierId(e.target.value)}
              disabled={loadingCarriers}
              className="w-full rounded-xl border py-2.5 pl-10 pr-9 text-xs font-medium text-zinc-800 transition focus:border-amber-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20 cursor-pointer appearance-none"
            >
              <option value="">
                {loadingCarriers
                  ? 'Carregando transportadoras...'
                  : 'Todas as parceiras (Comparativo geral)'}
              </option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Seção 1: Rota e Destinatário */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
              <MapPin className="size-4 text-amber-500" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950">Dados da Rota</h3>
          </div>
        </div>

        {/* Atalho Cliente Cadastrado */}
        <div className="mb-4">
          <label
            htmlFor="customer-select"
            className="block text-xs font-semibold text-zinc-700 mb-1.5"
          >
            Preencher com Cliente Cadastrado (Opcional)
          </label>
          <div className="relative">
            <UsersRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <select
              id="customer-select"
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              disabled={loadingCustomers}
              className="w-full rounded-xl border py-2.5 pl-10 pr-8 text-xs font-medium text-zinc-800 transition focus:border-amber-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400/20 cursor-pointer"
            >
              <option value="">
                {loadingCustomers
                  ? 'Carregando clientes...'
                  : 'Selecione um cliente para preencher o CEP de destino...'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.zipCode ? `— CEP: ${formatCEP(c.zipCode)}` : '(Sem CEP)'}
                  {c.city ? ` (${c.city}/${c.state})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Campos CEP Origem e Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CEP Origem */}
          <div>
            <label
              htmlFor="origin-zip"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              CEP de Origem (Expedição) <span className="text-red-500">*</span>
            </label>
            <input
              id="origin-zip"
              type="text"
              value={originZipCode}
              onChange={(e) => {
                setOriginZipCode(formatCEP(e.target.value));
                if (formErrors.originZipCode) {
                  setFormErrors((prev) => ({ ...prev, originZipCode: '' }));
                }
              }}
              placeholder="01001-000"
              maxLength={9}
              className={`w-full rounded-xl border py-2.5 px-3.5 text-sm font-mono text-zinc-900 transition focus:outline-hidden focus:ring-2 ${formErrors.originZipCode
                ? 'border-red-300 bg-red-50/40 focus:ring-red-300/40'
                : 'bg-zinc-50/50 focus:border-amber-400 focus:ring-amber-400/20'
                }`}
            />
            {formErrors.originZipCode ? (
              <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="size-3" /> {formErrors.originZipCode}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-zinc-400">
                Padrão: Centro de Distribuição / Matriz
              </p>
            )}
          </div>

          {/* CEP Destino */}
          <div>
            <label
              htmlFor="dest-zip"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              CEP de Destino (Entrega) <span className="text-red-500">*</span>
            </label>
            <input
              id="dest-zip"
              type="text"
              value={destinationZipCode}
              onChange={(e) => {
                setDestinationZipCode(formatCEP(e.target.value));
                if (formErrors.destinationZipCode) {
                  setFormErrors((prev) => ({ ...prev, destinationZipCode: '' }));
                }
              }}
              placeholder="00000-000"
              maxLength={9}
              className={`w-full rounded-xl border py-2.5 px-3.5 text-sm font-mono text-zinc-900 transition focus:outline-hidden focus:ring-2 ${formErrors.destinationZipCode
                ? 'border-red-300 bg-red-50/40 focus:ring-red-300/40'
                : 'bg-zinc-50/50 focus:border-amber-400 focus:ring-amber-400/20'
                }`}
            />
            {formErrors.destinationZipCode ? (
              <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="size-3" /> {formErrors.destinationZipCode}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-zinc-400">
                Informe o CEP do destinatário
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção 2: Especificações do Pacote & Presets */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
              <Package className="size-4 text-amber-500" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950">Dados da Carga</h3>
          </div>
        </div>

        {/* Botões de Predefinições Rápidas */}
        <div className="mb-4">
          <span className="block text-xs font-semibold text-zinc-700 mb-2">
            Predefinições Rápidas de Embalagem:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`rounded-xl p-2.5 text-left border transition cursor-pointer flex flex-col justify-between ${isSelected
                    ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/20'
                    : 'border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/70 hover:border-zinc-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{preset.name}</span>
                    <Icon className="size-3.5 text-zinc-400" />
                  </div>
                  <span className="mt-1 text-[10px] text-zinc-500 font-mono">
                    {preset.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs de Peso e Dimensões */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Peso Real */}
          <div>
            <label
              htmlFor="cargo-weight"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              Peso Real (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="cargo-weight"
                type="number"
                step="0.01"
                min="0.01"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-zinc-900 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* Comprimento */}
          <div>
            <label
              htmlFor="cargo-length"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              Comprimento <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="cargo-length"
                type="number"
                step="0.5"
                min="1"
                value={length}
                onChange={(e) => {
                  setLength(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-zinc-900 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          {/* Largura */}
          <div>
            <label
              htmlFor="cargo-width"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              Largura <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="cargo-width"
                type="number"
                step="0.5"
                min="1"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-zinc-900 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          {/* Altura */}
          <div>
            <label
              htmlFor="cargo-height"
              className="block text-xs font-semibold text-zinc-700 mb-1"
            >
              Altura <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="cargo-height"
                type="number"
                step="0.5"
                min="1"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-3 pr-8 text-sm font-semibold text-zinc-900 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>
        </div>

        {/* Valor Declarado (Seguro) */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <label
            htmlFor="cargo-value"
            className="block text-xs font-semibold text-zinc-700 mb-1"
          >
            Valor Declarado da Carga (R$)
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 pointer-events-none">
              R$
            </span>
            <input
              id="cargo-value"
              type="number"
              step="1"
              min="0"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border bg-zinc-50/50 py-2 pl-9 pr-3 text-sm font-semibold text-zinc-900 focus:border-amber-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Utilizado no cálculo de seguro/ad-valorem da transportadora (0,5% do valor da carga).
          </p>
        </div>
      </div>

      {/* Seção 3: Widget de Cubagem em Tempo Real */}
      <CubagePreviewWidget
        length={numericLength}
        width={numericWidth}
        height={numericHeight}
        actualWeight={numericWeight}
      />

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-zinc-800 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin text-amber-400" />
            <span>Consultando Transportadoras...</span>
          </>
        ) : (
          <>
            <Calculator className="size-4 text-amber-400" />
            <span>{submitButtonText}</span>
          </>
        )}
      </button>
    </form>
  );
}
