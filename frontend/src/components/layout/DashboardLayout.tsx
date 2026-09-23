'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calculator,
  ChevronsUpDown,
  CircleHelp,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Truck,
  UsersRound,
  X,
} from 'lucide-react';
import { authService } from '@/src/services/auth';
import { onSessionExpired } from '@/src/services/http/auth-events';
import { CompanyInfo, UserProfile } from '@/src/types';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';
import { RealtimeToastContainer } from '@/src/components/notifications/RealtimeToastContainer';

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
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
  pathname: string;
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
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
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
            const active =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href));

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
                  className={`size-4.5 shrink-0 ${active ? 'text-amber-700' : 'text-zinc-500'
                    }`}
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

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    return onSessionExpired(() => {
      router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    async function loadAuth() {
      const [u, c] = await Promise.all([
        authService.getCurrentUser(),
        authService.getCompanyInfo(),
      ]);
      if (isMounted) {
        setUser(u);
        setCompany(c);
      }
    }
    loadAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

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

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-amber-200 selection:text-zinc-950">
        {/* Sidebar Desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-200/90 bg-white px-4 py-5 lg:flex lg:flex-col">
          <SidebarContent
            company={company}
            user={user}
            pathname={pathname}
            onLogout={handleLogout}
          />
        </aside>

        {/* Sidebar Mobile (Gaveta deslizante) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white p-5 shadow-2xl transition-transform duration-300">
              <SidebarContent
                company={company}
                user={user}
                pathname={pathname}
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* Conteúdo da Área Principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar Desktop */}
          <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-zinc-200/90 bg-white/95 px-8 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-zinc-600">
                {company?.name || 'Sua Empresa'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </header>

          {/* Topbar Mobile */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200/90 bg-white/95 px-4 backdrop-blur-sm lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BrandMark />
              <span className="text-sm font-semibold text-zinc-950">
                {company?.name || 'LogiFlow'}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
                {user?.initials || 'U'}
              </span>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      <RealtimeToastContainer />
    </NotificationProvider>
  );
}
