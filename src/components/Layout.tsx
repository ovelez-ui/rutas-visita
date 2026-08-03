import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ConfirmDialog } from './ConfirmDialog';
import {
  IconConfig,
  IconDashboard,
  IconDoc,
  IconMoon,
  IconMore,
  IconRutas,
  IconSpark,
  IconSun,
  IconTiendas,
  IconWallet,
} from './icons';
import { Toaster } from './Toaster';

// Secciones principales (barra inferior en móvil)
const NAV_PRINCIPAL = [
  { to: '/', label: 'Inicio', Icon: IconDashboard, end: true },
  { to: '/rutas', label: 'Rutas', Icon: IconRutas },
  { to: '/especial', label: 'Especial', Icon: IconSpark },
  { to: '/viaticos', label: 'Viáticos', Icon: IconWallet },
];

// Secciones secundarias (menú "Más" + sidebar)
export const NAV_SECUNDARIO = [
  { to: '/tiendas', label: 'Tiendas', Icon: IconTiendas },
  { to: '/reporte', label: 'Reporte', Icon: IconDoc },
  { to: '/presentacion', label: 'Presentación IA', Icon: IconSpark },
  { to: '/config', label: 'Ajustes', Icon: IconConfig },
];

const RUTAS_SECUNDARIAS = ['/mas', ...NAV_SECUNDARIO.map((n) => n.to)];

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="inline-flex items-center rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700">
        <img src="./logo-pasteur.png" alt="Pasteur" className="h-4 w-auto" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Rutas de Visita</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Planeador de campo</div>
      </div>
    </div>
  );
}

function BotonTema() {
  const tema = useStore((s) => s.tema);
  const toggle = useStore((s) => s.toggleTema);
  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      aria-label="Cambiar tema"
    >
      {tema === 'claro' ? <IconMoon className="h-5 w-5" /> : <IconSun className="h-5 w-5" />}
    </button>
  );
}

const claseSidebar = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Layout() {
  const tema = useStore((s) => s.tema);
  const { pathname } = useLocation();
  const enSecundario = RUTAS_SECUNDARIAS.includes(pathname);

  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
  }, [tema]);

  return (
    <div className="min-h-[100dvh] md:flex">
      {/* Sidebar escritorio (todas las secciones) */}
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 md:flex dark:border-slate-800 dark:bg-slate-900">
        <Marca />
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV_PRINCIPAL.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={claseSidebar}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
          {NAV_SECUNDARIO.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={claseSidebar}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="px-2 text-[11px] text-slate-400">v1</span>
          <BotonTema />
        </div>
      </aside>

      {/* Encabezado móvil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <Marca />
          <BotonTema />
        </header>

        {/* Indicador de conexión */}
        {!online && (
          <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
            Sin conexión · los cambios se guardan y se subirán al reconectar
          </div>
        )}

        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegación inferior móvil: 4 principales + Más */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {NAV_PRINCIPAL.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon className="h-[22px] w-[22px]" />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/mas"
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
            enSecundario ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <IconMore className="h-[22px] w-[22px]" />
          Más
        </NavLink>
      </nav>

      <Toaster />
      <ConfirmDialog />
    </div>
  );
}
