'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell, Calculator, ChevronsUpDown,
  CircleHelp, FileBarChart, FileText, History, LayoutDashboard, LogOut, Menu, MoreHorizontal,
  Search, Settings, ShieldCheck, Truck, UsersRound, X,
} from 'lucide-react';
import { authService } from '@/src/services/auth';
import { dashboardService } from '@/src/services/dashboard';
import { DashboardData, Quote, CarrierShare, UserProfile, CompanyInfo } from '@/src/types';

const menuItems = [
  { label: 'Visão geral', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Simular frete', icon: Calculator, href: '/fretes/simular' },
  { label: 'Histórico', icon: History, href: '/fretes/historico' },
  { label: 'Clientes', icon: UsersRound, href: '/clientes' },
  { label: 'Transportadoras', icon: Truck, href: '/transportadoras' },
  { label: 'Relatórios', icon: FileBarChart, href: '/relatorios' },
  { label: 'Auditoria', icon: ShieldCheck, href: '/auditoria' },
];

function BrandMark() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-amber-400 shadow-sm">
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
      </svg>
    </span>
  );
}

function SidebarContent({
  company,
  user,
  pathname,
  onClose,
  onLogout,
}: {
  company: CompanyInfo | null;
  user: UserProfile | null;
  pathname?: string;
  onClose?: () => void;
  onLogout?: () => void;
}) {
  const companyName = company?.name || 'Sua Empresa';
  const environment = company?.environment || 'Ambiente LogiFlow';
  const userName = user?.name || 'Usuário';
  const userRole = user?.role || 'Operador';
  const userInitials = user?.initials || userName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center justify-between px-1">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-zinc-950">
                {companyName}
              </span>
              <span className="block truncate text-xs text-zinc-500">
                {environment}
              </span>
            </span>
          </Link>
          {onClose ? (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
          ) : (
            <ChevronsUpDown className="size-4 text-zinc-400" aria-hidden="true" />
          )}
        </div>

        <nav className="mt-8 space-y-1" aria-label="Navegação principal">
          {menuItems.map(({ label, icon: Icon, href }) => {
            const currentPath = pathname || '/dashboard';
            const active =
              currentPath === href ||
              (href !== '/dashboard' && currentPath.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active
                  ? 'bg-amber-50 font-semibold text-zinc-950 ring-1 ring-amber-200/80 shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                  }`}
              >
                <Icon
                  className={`size-4.5 shrink-0 ${active ? 'text-amber-700' : 'text-zinc-500'}`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-zinc-100 pt-5">
          <Link
            href="/empresa"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
          >
            <Settings className="size-4.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span className="truncate">Empresa e configurações</span>
          </Link>
          <a
            href="#ajuda"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
          >
            <CircleHelp className="size-4.5 shrink-0 text-zinc-500" aria-hidden="true" />
            <span className="truncate">Central de ajuda</span>
          </a>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
            {userInitials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-zinc-900">
              {userName}
            </span>
            <span className="block truncate text-xs text-zinc-500">
              {userRole}
            </span>
          </span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Encerrar sessão"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 transition cursor-pointer"
            aria-label="Encerrar sessão"
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  // Fecha o menu com tecla ESC e trava o scroll quando o drawer mobile estiver aberto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Carrega dados reais do backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const data = await dashboardService.getData();
        if (isMounted) {
          setDashboardData(data);
        }
      } catch {
        // Se a API ainda não estiver conectada ao backend, permanece vazio sem quebrar
        if (isMounted) {
          setDashboardData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const todayFormatted = (() => {
    try {
      const raw = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date());
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch {
      return '';
    }
  })();

  const company = dashboardData?.company ?? null;
  const user = dashboardData?.user ?? null;
  const metricsData = dashboardData?.metrics;
  const recentQuotes = dashboardData?.recentQuotes ?? [];
  const topCarriers = dashboardData?.topCarriers ?? [];
  const chartSeries = dashboardData?.chartSeries ?? [];
  const maxQuotes = chartSeries.length > 0 ? Math.max(...chartSeries.map((p) => p.quotesCount)) : 0;
  const yAxisMax = maxQuotes > 0 ? (maxQuotes <= 4 ? 4 : Math.ceil(maxQuotes * 1.15)) : 4;
  const totalPeriodQuotes = chartSeries.reduce((acc, curr) => acc + curr.quotesCount, 0);
  const insight = dashboardData?.insight ?? null;

  const metricCards = [
    {
      label: 'Cotações no período',
      value: metricsData ? metricsData.quotesCount.toLocaleString('pt-BR') : '0',
      detail: metricsData?.quotesGrowthPercent != null
        ? `${metricsData.quotesGrowthPercent >= 0 ? '+' : ''}${metricsData.quotesGrowthPercent}%`
        : 'simulações registradas',
      positive: metricsData?.quotesGrowthPercent != null
        ? metricsData.quotesGrowthPercent >= 0
        : null,
      icon: FileText,
    },
    {
      label: 'Custo médio cotado',
      value: metricsData
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricsData.averageCost)
        : 'R$ 0,00',
      detail: metricsData?.averageCostGrowthPercent != null
        ? `${metricsData.averageCostGrowthPercent >= 0 ? '+' : ''}${metricsData.averageCostGrowthPercent}%`
        : 'média por simulação',
      positive: metricsData?.averageCostGrowthPercent != null
        ? metricsData.averageCostGrowthPercent <= 0
        : null,
      icon: BarChart3,
    },
    {
      label: 'Peso cubado aplicado',
      value: metricsData ? `${metricsData.cubageAppliedPercent}%` : '0%',
      detail: metricsData?.cubageQuotesCount != null && metricsData.quotesCount > 0
        ? `${metricsData.cubageQuotesCount} de ${metricsData.quotesCount} ${metricsData.quotesCount === 1 ? 'cotação' : 'cotações'}`
        : 'nenhuma cotação afetada',
      positive: null,
      icon: Calculator,
    },
    {
      label: 'Parceiros ativos',
      value: metricsData ? metricsData.activePartnersCount.toString() : '0',
      detail: 'na sua operação',
      positive: null,
      icon: Truck,
    },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-amber-200 selection:text-zinc-950">
      {/* Sidebar Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-200/90 bg-white px-4 py-5 lg:flex lg:flex-col">
        <SidebarContent company={company} user={user} pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Drawer Mobile / Tablet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-70 max-w-[85vw] flex-col border-r border-zinc-200 bg-white px-4 py-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent company={company} user={user} pathname={pathname} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Área Principal de Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header Superior */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
              aria-label="Abrir menu lateral"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="hidden sm:inline">Ambiente da empresa</span>
              <span className="hidden text-zinc-300 sm:inline">/</span>
              <span className="font-semibold text-zinc-900">Visão geral</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="relative rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Notificações"
            >
              <Bell className="size-5" />
            </button>
          </div>
        </header>

        {/* Conteúdo do Dashboard */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Cabeçalho da Página */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                {todayFormatted && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    {todayFormatted}
                  </p>
                )}
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
                  Visão geral da operação
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Acompanhe as cotações, os parceiros ativos e os sinais que ajudam sua equipe a decidir melhor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/fretes/simular"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  <Calculator className="size-4 text-amber-400" aria-hidden="true" />
                  Nova simulação
                </Link>
              </div>
            </section>

            {/* Grid de Métricas */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do período">
              {metricCards.map(({ label, value, detail, positive, icon: Icon }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-zinc-600">{label}</span>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                    {loading ? '-' : value}
                  </p>
                  <p
                    className={`mt-2 flex items-center gap-1 text-xs font-medium ${positive === null
                      ? 'text-zinc-500'
                      : positive
                        ? 'text-emerald-700'
                        : 'text-zinc-500'
                      }`}
                  >
                    {positive !== null &&
                      (positive ? (
                        <ArrowDownRight className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      ))}
                    {detail && (
                      <>
                        {detail}{' '}
                        {positive !== null && <span className="font-normal text-zinc-400">vs. anterior</span>}
                      </>
                    )}
                  </p>
                </article>
              ))}
            </section>

            {/* Evolução de Cotações & Card de Insight */}
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.75fr)]">
              <article className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-zinc-950">Evolução das cotações</h2>
                        {totalPeriodQuotes > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/60">
                            {totalPeriodQuotes} {totalPeriodQuotes === 1 ? 'cotação' : 'cotações'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">Volume de simulações concluídas no período.</p>
                    </div>
                  </div>

                  {chartSeries.length > 0 ? (
                    <div className="mt-6 flex flex-col">
                      {/* Área do gráfico com eixos e barras */}
                      <div className="relative h-48 w-full">
                        {/* Linhas de grade horizontais e valores do eixo Y */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
                          {[yAxisMax, Math.round(yAxisMax / 2), 0].map((tick, idx) => (
                            <div key={idx} className="flex items-center gap-3 w-full">
                              <span className="w-5 text-right text-[11px] font-medium text-zinc-400 select-none">
                                {tick}
                              </span>
                              <div className="h-px flex-1 border-b border-dashed border-zinc-100" />
                            </div>
                          ))}
                        </div>

                        {/* Colunas do gráfico alinhadas à base */}
                        <div className="relative ml-8 flex h-full items-end justify-between gap-2 sm:gap-4 pb-2">
                          {chartSeries.map((point) => {
                            const pct = yAxisMax > 0 ? Math.min(100, Math.round((point.quotesCount / yAxisMax) * 100)) : 0;
                            const hasQuotes = point.quotesCount > 0;

                            return (
                              <div
                                key={point.date}
                                className="group relative flex flex-1 h-full flex-col justify-end items-center cursor-pointer"
                              >
                                {/* Tooltip flutuante no hover */}
                                <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                                  <div className="rounded-lg bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl">
                                    <span className="text-amber-400 font-bold mr-1">{point.quotesCount}</span>
                                    <span>{point.quotesCount === 1 ? 'cotação' : 'cotações'}</span>
                                    <span className="text-zinc-400 ml-1 font-normal">({point.label})</span>
                                  </div>
                                  <div className="size-1.5 rotate-45 bg-zinc-950 -mt-1" />
                                </div>

                                {/* Coluna com efeito hover sutil */}
                                <div className="absolute inset-x-0.5 inset-y-0 rounded-lg bg-zinc-100/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                {/* Barra de valor */}
                                {hasQuotes ? (
                                  <div
                                    className="relative z-10 w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 transition-all duration-300 shadow-xs"
                                    style={{
                                      height: `${Math.max(8, pct)}%`,
                                    }}
                                  >
                                    {/* Indicador de valor no topo da barra se houver altura suficiente */}
                                    {pct >= 30 && (
                                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">
                                        {point.quotesCount}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  /* Marcador discreto de repouso para 0 cotações */
                                  <div className="relative z-10 h-1.5 w-full max-w-[42px] rounded-full bg-zinc-200/90 group-hover:bg-amber-300 transition-colors" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Eixo X com datas */}
                      <div className="ml-8 mt-2 flex items-center justify-between gap-2 sm:gap-4 border-t border-zinc-100 pt-2">
                        {chartSeries.map((point) => (
                          <div key={point.date} className="flex-1 text-center">
                            <span className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                              {point.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
                      <BarChart3 className="size-8 text-zinc-300 mb-2" />
                      <p className="text-sm font-medium text-zinc-600">Sem dados suficientes para o gráfico</p>
                      <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                        O volume de cotações por período será exibido automaticamente conforme novas simulações forem geradas.
                      </p>
                    </div>
                  )}
                </div>
              </article>

              {/* Card de Insight / Inteligência da Operação */}
              <article className="flex flex-col justify-between rounded-2xl border border-zinc-900 bg-zinc-950 p-6 text-white shadow-xs">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                      <BarChart3 className="size-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                      Inteligência
                    </span>
                  </div>
                  <h2 className="mt-6 text-lg font-semibold tracking-tight">
                    {insight?.title || 'Controle operacional ativo'}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {insight?.description ||
                      'O motor da LogiFlow monitora parâmetros de cubagem e regras contratuais em cada cotação para garantir a melhor decisão de frete.'}
                  </p>
                </div>
                <Link
                  href={insight?.actionUrl || '/fretes/historico'}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-400 transition hover:text-amber-300"
                >
                  {insight?.actionLabel || 'Ver histórico de cotações'} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            </section>

            {/* Tabela de Cotações & Participação dos Parceiros */}
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.75fr)]">
              <article className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs">
                <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">Cotações recentes</h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-zinc-500">As últimas decisões registradas no ambiente.</p>
                  </div>
                  {recentQuotes.length > 0 && (
                    <Link
                      href="/fretes/historico"
                      className="hidden items-center gap-1 text-sm font-semibold text-amber-700 transition hover:text-amber-800 sm:inline-flex"
                    >
                      Ver todas <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>

                <div className="overflow-x-auto border-t border-zinc-100">
                  {recentQuotes.length > 0 ? (
                    <table className="w-full min-w-155 text-left text-sm">
                      <thead className="bg-zinc-50/80 text-xs font-medium text-zinc-500">
                        <tr>
                          <th className="px-5 py-3">Rota</th>
                          <th className="px-5 py-3">Melhor opção</th>
                          <th className="px-5 py-3">Valor</th>
                          <th className="px-5 py-3">Prazo</th>
                          <th className="px-5 py-3 text-right">Criada em</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {recentQuotes.map((quote) => (
                          <tr key={quote.id} className="transition hover:bg-zinc-50/70">
                            <td className="px-5 py-3.5 font-medium text-zinc-800">{quote.route}</td>
                            <td className="px-5 py-3.5 text-zinc-600">{quote.carrierName}</td>
                            <td className="px-5 py-3.5 font-semibold text-zinc-900">{quote.formattedValue}</td>
                            <td className="px-5 py-3.5">
                              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                                {quote.formattedDeadline}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-zinc-500">{quote.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3">
                        <FileText className="size-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-900">Nenhuma cotação registrada ainda</h3>
                      <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                        As simulações de frete geradas pela sua equipe serão listadas aqui com rotas, valores e prazos.
                      </p>
                      <Link
                        href="/fretes/simular"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800"
                      >
                        <Calculator className="size-3.5 text-amber-400" />
                        Fazer primeira simulação
                      </Link>
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">Parceiros mais cotados</h2>
                    <p className="mt-1 text-sm text-zinc-500">Participação nas melhores opções.</p>
                  </div>
                  <button
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label="Mais opções"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {topCarriers.length > 0 ? (
                    topCarriers.map((carrier) => (
                      <div key={carrier.carrierId}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-zinc-700">{carrier.carrierName}</span>
                          <span className="font-semibold text-zinc-900">{carrier.formattedPercentage}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${carrier.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Truck className="size-8 text-zinc-300 mb-2" />
                      <p className="text-sm font-medium text-zinc-600">Nenhum parceiro com dados de cotação</p>
                      <p className="mt-1 text-xs text-zinc-400 max-w-xs">
                        Cadastre e ative suas transportadoras parceiras para acompanhar os indicadores de participação.
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href="/transportadoras"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition hover:text-amber-800"
                >
                  Gerenciar parceiros <ArrowRight className="size-4" />
                </Link>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
