import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle, ZonaBadge } from '../components/ui';
import { IconRefresh } from '../components/icons';
import { listarVisitas, type VisitaFila } from '../lib/visitas';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
      <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function Reporte() {
  const tiendas = useStore((s) => s.tiendas);
  const [filas, setFilas] = useState<VisitaFila[]>([]);
  const [fuente, setFuente] = useState<'nube' | 'local'>('nube');
  const [cargando, setCargando] = useState(true);

  const mapaTiendas = useMemo(() => new Map(tiendas.map((t) => [t.id_tienda, t])), [tiendas]);

  const cargar = async () => {
    setCargando(true);
    const { filas, fuente } = await listarVisitas();
    // Solo puntos con foto u observación
    setFilas(filas.filter((f) => (f.fotos?.length ?? 0) > 0 || (f.observaciones ?? '').trim()));
    setFuente(fuente);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalFotos = filas.reduce((s, f) => s + (f.fotos?.length ?? 0), 0);
  const conObs = filas.filter((f) => (f.observaciones ?? '').trim()).length;
  const fechaReporte = new Date().toLocaleString('es-CO');

  return (
    <div>
      <div className="no-print">
        <PageTitle
          title="Reporte de visitas"
          subtitle="Consolidado general de puntos con foto u observación"
          action={
            <div className="flex gap-2">
              <button
                onClick={cargar}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <IconRefresh className="h-4 w-4" /> Actualizar
              </button>
              <button
                onClick={() => window.print()}
                disabled={filas.length === 0}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                Imprimir / PDF
              </button>
            </div>
          }
        />
      </div>

      {/* Encabezado del reporte (visible también al imprimir) */}
      <div className="mb-4 hidden print:block">
        <h1 className="text-xl font-bold">Reporte de visitas — Consolidado</h1>
        <p className="text-sm text-slate-600">Generado el {fechaReporte}</p>
      </div>

      {cargando ? (
        <Card className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando visitas…</Card>
      ) : filas.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aún no hay visitas con foto u observación. Registra algunas desde las rutas y vuelve aquí.
          </p>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="mb-2 grid grid-cols-3 gap-2.5">
            <Stat label="Puntos con registro" value={filas.length} />
            <Stat label="Fotos" value={totalFotos} />
            <Stat label="Con observación" value={conObs} />
          </div>
          <p className="mb-5 text-[11px] text-slate-400 no-print">
            Datos desde {fuente === 'nube' ? 'la nube (Supabase)' : 'este dispositivo (sin conexión)'} · {fechaReporte}
          </p>

          {/* Secciones por punto */}
          <div className="space-y-3">
            {filas.map((f, i) => {
              const t = mapaTiendas.get(f.id_tienda);
              return (
                <Card key={f.id_tienda} className="p-4 print:border print:shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
                        {t?.nombre ?? f.id_tienda}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {f.id_tienda}
                        </span>
                        {t && <ZonaBadge zona={t.zona} size="xs" />}
                        {f.actualizado && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(f.actualizado).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(f.observaciones ?? '').trim() && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                      {f.observaciones}
                    </p>
                  )}

                  {f.fotos?.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {f.fotos.map((foto) => (
                        <a
                          key={foto.id}
                          href={foto.url ?? foto.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <img src={foto.url ?? foto.dataUrl} alt="foto de visita" className="h-full w-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
