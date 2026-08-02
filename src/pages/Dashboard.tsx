import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, PageTitle, ZonaBadge } from '../components/ui';
import { IconGo, IconRutas, IconWallet } from '../components/icons';
import { listarViaticos, formatoCOP, hoyISO } from '../lib/viaticos';

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
      <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const tiendas = useStore((s) => s.tiendas);
  const plan = useStore((s) => s.plan);

  const [totalHoy, setTotalHoy] = useState<number | null>(null);
  useEffect(() => {
    listarViaticos()
      .then((vs) => setTotalHoy(vs.filter((v) => v.fecha === hoyISO()).reduce((s, v) => s + Number(v.monto || 0), 0)))
      .catch(() => setTotalHoy(null));
  }, []);

  const zonas = useMemo(() => [...new Set(tiendas.map((t) => t.zona))].sort(), [tiendas]);
  const dia1 = plan?.dias[0];
  const visit1 = dia1 ? dia1.paradas.filter((p) => p.visitada).length : 0;
  const total1 = dia1 ? dia1.paradas.length : 0;
  const pct1 = total1 ? Math.round((visit1 / total1) * 100) : 0;

  const porZona = useMemo(
    () =>
      zonas
        .map((z) => ({ zona: z, n: tiendas.filter((t) => t.zona === z).length }))
        .sort((a, b) => b.n - a.n),
    [zonas, tiendas],
  );

  return (
    <div>
      <PageTitle title="Inicio" subtitle="Tu día de un vistazo" />

      {/* Ruta de hoy */}
      <Link to="/rutas">
        <Card className="overflow-hidden transition hover:border-brand-300">
          <div className="flex items-center gap-3 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <IconRutas className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {plan ? 'Ruta de hoy' : 'Aún no has generado rutas'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {plan
                  ? `Día 1 · ${dia1?.zonas.join(', ')} · ${visit1}/${total1} visitadas`
                  : 'Toca para generar tus rutas por zona y proximidad'}
              </div>
            </div>
            <IconGo className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
          {plan && (
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct1}%` }} />
            </div>
          )}
        </Card>
      </Link>

      {/* Viáticos de hoy */}
      <Link to="/viaticos" className="mt-3 block">
        <Card className="flex items-center gap-3 p-5 transition hover:border-brand-300">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <IconWallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Viáticos de hoy</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Toca para registrar un gasto</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {totalHoy == null ? '—' : formatoCOP(totalHoy)}
            </div>
          </div>
        </Card>
      </Link>

      {/* Stats compactas */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <MiniStat label="Tiendas" value={tiendas.length} />
        <MiniStat label="Zonas" value={zonas.length} />
        <MiniStat label="Días de ruta" value={plan?.dias.length ?? 0} />
      </div>

      {/* Distribución por zona */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Tiendas por zona</h2>
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {porZona.slice(0, 8).map(({ zona, n }) => (
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
