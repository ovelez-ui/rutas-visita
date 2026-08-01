import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, PageTitle, ZonaBadge } from '../components/ui';
import { IconGo, IconPin, IconRutas, IconSpark, IconTiendas } from '../components/icons';

function Stat({ label, value, hint, Icon, tone }: {
  label: string;
  value: string | number;
  hint?: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
          <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
          {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const tiendas = useStore((s) => s.tiendas);
  const plan = useStore((s) => s.plan);

  const zonas = [...new Set(tiendas.map((t) => t.zona))].sort();
  const totalDias = plan?.dias.length ?? 0;
  const pendientesHoy = plan?.dias[0]
    ? plan.dias[0].paradas.filter((p) => !p.visitada).length
    : 0;

  // Conteo de tiendas por zona (para vista rápida)
  const porZona = zonas
    .map((z) => ({ zona: z, n: tiendas.filter((t) => t.zona === z).length }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <PageTitle title="Inicio" subtitle="Resumen de tu operación de visitas" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tiendas" value={tiendas.length} hint={`${zonas.length} zonas`} Icon={IconTiendas} tone="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" />
        <Stat label="Días planificados" value={totalDias} hint={plan ? 'Plan activo' : 'Sin generar'} Icon={IconRutas} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
        <Stat label="Pendientes hoy" value={plan ? pendientesHoy : '—'} hint="Día 1" Icon={IconPin} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <Stat label="Zonas" value={zonas.length} hint="Agrupación de rutas" Icon={IconPin} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
      </div>

      {/* Ruta de hoy / CTA */}
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {plan ? 'Ruta de hoy' : 'Aún no has generado rutas'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {plan
                ? `Día 1 · ${plan.dias[0]?.paradas.length ?? 0} paradas · ${plan.dias[0]?.zonas.join(', ')}`
                : 'Genera las rutas para organizar tus visitas por zona y proximidad.'}
            </p>
          </div>
          <Link
            to="/rutas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {plan ? 'Ver ruta de hoy' : 'Ir a Rutas'}
            <IconGo className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      {/* Acceso al reporte */}
      <Link
        to="/reporte"
        className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <IconPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Reporte de visitas</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Consolidado con fotos y observaciones</div>
          </div>
        </div>
        <IconGo className="h-5 w-5 text-slate-400" />
      </Link>

      {/* Acceso a la presentación con IA */}
      <Link
        to="/presentacion"
        className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <IconSpark className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Presentación con IA</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pase de diapositivas del día</div>
          </div>
        </div>
        <IconGo className="h-5 w-5 text-slate-400" />
      </Link>

      {/* Distribución por zona */}
      <div className="mt-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Tiendas por zona
        </h2>
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {porZona.map(({ zona, n }) => (
            <div key={zona} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <ZonaBadge zona={zona} />
              <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">{n}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
