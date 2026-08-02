import type { ReactNode } from 'react';
import { colorZona } from '../lib/zonas';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

export function ZonaBadge({ zona, size = 'sm' }: { zona: string; size?: 'sm' | 'xs' }) {
  const c = colorZona(zona);
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad} ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {zona}
    </span>
  );
}

export function EmptyState({
  Icon,
  titulo,
  mensaje,
  children,
}: {
  Icon: (p: { className?: string }) => ReactNode;
  titulo: string;
  mensaje?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{titulo}</div>
        {mensaje && <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{mensaje}</p>}
      </div>
      {children}
    </Card>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
