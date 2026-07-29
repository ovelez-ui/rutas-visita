import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle } from '../components/ui';
import { IconRutas } from '../components/icons';
import { generarPlan, kmDia } from '../lib/rutas';
import { DiaSelector } from '../components/DiaSelector';
import { RutaDia } from '../components/RutaDia';

function Resumen({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
      <div className={`text-xl font-semibold tabular-nums ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Rutas() {
  const tiendas = useStore((s) => s.tiendas);
  const plan = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const opciones = useStore((s) => s.opciones);
  const toast = useStore((s) => s.toast);
  const [generando, setGenerando] = useState(false);
  const [diaSel, setDiaSel] = useState(1);
  const [verResumen, setVerResumen] = useState(false);

  const mapaTiendas = useMemo(() => new Map(tiendas.map((t) => [t.id_tienda, t])), [tiendas]);

  // Mantener el día seleccionado dentro de rango si cambia el plan
  useEffect(() => {
    if (plan && diaSel > plan.dias.length) setDiaSel(1);
  }, [plan, diaSel]);

  const generar = () => {
    setGenerando(true);
    setTimeout(() => {
      const p = generarPlan(tiendas, opciones);
      setPlan(p);
      setDiaSel(1);
      const cortos = p.dias.filter((d) => d.paradas.length < p.objetivoMin).length;
      toast(`Plan generado: ${p.dias.length} días${cortos ? ` · ${cortos} bajo el mínimo` : ''}.`, cortos ? 'info' : 'ok');
      setGenerando(false);
    }, 30);
  };

  const stats = useMemo(() => {
    if (!plan) return null;
    const totalParadas = plan.dias.reduce((s, d) => s + d.paradas.length, 0);
    const visitadas = plan.dias.reduce((s, d) => s + d.paradas.filter((p) => p.visitada).length, 0);
    const cortos = plan.dias.filter((d) => d.paradas.length < plan.objetivoMin).length;
    const mezclados = plan.dias.filter((d) => d.zonas.length > 1).length;
    const kmTotal = plan.dias.reduce((s, d) => s + kmDia(d, mapaTiendas), 0);
    const sinCoords = tiendas.filter((t) => t.lat == null).length;
    return { totalParadas, visitadas, cortos, mezclados, kmTotal, sinCoords };
  }, [plan, mapaTiendas, tiendas]);

  const diaActual = plan?.dias.find((d) => d.dia === diaSel) ?? plan?.dias[0];

  return (
    <div>
      <PageTitle
        title="Rutas"
        subtitle={plan ? `${plan.dias.length} días · ${stats!.visitadas}/${stats!.totalParadas} visitadas` : 'Visitas organizadas por día'}
        action={
          <button
            onClick={generar}
            disabled={generando || tiendas.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
          >
            <IconRutas className="h-4 w-4" />
            {generando ? 'Generando…' : plan ? 'Regenerar' : 'Generar rutas'}
          </button>
        }
      />

      {!plan || !diaActual ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <IconRutas className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aún no hay rutas</h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Pulsa «Generar rutas» para agrupar tus {tiendas.length} tiendas por zona, ordenarlas por
            proximidad y repartirlas en días de {opciones.min}–{opciones.max} paradas.
          </p>
        </Card>
      ) : (
        <>
          {/* Toggle resumen del plan */}
          <button
            onClick={() => setVerResumen((v) => !v)}
            className="mb-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {verResumen ? '▲ Ocultar resumen del plan' : '▼ Ver resumen del plan'}
          </button>

          {verResumen && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Resumen label="Días" value={plan.dias.length} />
                <Resumen label="Paradas" value={stats!.totalParadas} />
                <Resumen label={`Días bajo ${plan.objetivoMin}`} value={stats!.cortos} tone={stats!.cortos ? 'text-amber-600 dark:text-amber-400' : undefined} />
                <Resumen label="Distancia total" value={`${stats!.kmTotal.toFixed(0)} km`} />
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {stats!.cortos > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">⚠ {stats!.cortos} día(s) con menos de {plan.objetivoMin} paradas.</p>
                )}
                {stats!.mezclados > 0 && (
                  <p className="text-slate-500 dark:text-slate-400">↔ {stats!.mezclados} día(s) combinan zonas cercanas.</p>
                )}
                {stats!.sinCoords > 0 && (
                  <p className="text-slate-500 dark:text-slate-400">📍 {stats!.sinCoords} tienda(s) sin coordenadas.</p>
                )}
              </div>
            </div>
          )}

          {/* Selector de día */}
          <DiaSelector plan={plan} seleccionado={diaSel} onSelect={setDiaSel} />

          {/* Vista de campo del día */}
          <RutaDia key={diaActual.dia} dia={diaActual} />
        </>
      )}
    </div>
  );
}
