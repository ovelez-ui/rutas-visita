import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle } from '../components/ui';
import { IconMail, IconSpark } from '../components/icons';
import { generarPresentacion, type Slide } from '../lib/presentacion';
import { abrirCorreo } from '../lib/correo';
import { hoyISO } from '../lib/viaticos';

function correoPresentacion(fecha: string, slides: Slide[]): { subject: string; body: string } {
  const subject = `Presentación de visitas — ${fecha}`;
  const cuerpo = slides
    .map((s, i) => [`${i + 1}. ${s.nombre}${s.zona ? ' — ' + s.zona : ''}`, s.texto, s.foto_url ? `Foto: ${s.foto_url}` : ''].filter(Boolean).join('\n'))
    .join('\n\n');
  return { subject, body: `Presentación de visitas del ${fecha}\n\n${cuerpo}` };
}

// Pase de diapositivas a pantalla completa + exportar
function Slideshow({ slides, fecha, onCerrar }: { slides: Slide[]; fecha: string; onCerrar: () => void }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const fmt = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Interactivo (no se imprime) */}
      <div className="no-print fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 truncate text-sm font-medium">
            Presentación · <span className="text-white/70">{fmt}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => { const { subject, body } = correoPresentacion(fecha, slides); abrirCorreo(subject, body); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/10"
            >
              <IconMail className="h-4 w-4" /> Correo
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/10"
            >
              PDF
            </button>
            <span className="ml-1 text-xs tabular-nums text-white/60">{i + 1}/{slides.length}</span>
            <button onClick={onCerrar} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10" aria-label="Cerrar">✕</button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-5">
          {s.foto_url ? (
            <img src={s.foto_url} alt={s.nombre} className="max-h-[46vh] w-auto max-w-full rounded-2xl object-contain shadow-lg" />
          ) : (
            <div className="grid h-40 w-full max-w-md place-items-center rounded-2xl bg-white/5 text-white/40">Sin foto</div>
          )}
          <div className="w-full max-w-2xl text-center">
            <h2 className="text-lg font-semibold">{s.nombre}</h2>
            {s.zona && <div className="mt-0.5 text-xs text-white/50">{s.zona}</div>}
            <p className="mt-3 text-[15px] leading-relaxed text-white/90">{s.texto}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
          <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-30">← Anterior</button>
          <button onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))} disabled={i === slides.length - 1}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-700 disabled:opacity-30">Siguiente →</button>
        </div>
      </div>

      {/* Versión imprimible: todas las láminas (solo al imprimir / Guardar PDF) */}
      <div className="hidden print:block">
        <h1 className="mb-1 text-xl font-bold">Presentación de visitas</h1>
        <p className="mb-5 text-sm text-slate-600">{fmt}</p>
        {slides.map((sl, n) => (
          <div key={sl.id_tienda} className="mb-8" style={{ breakInside: 'avoid' }}>
            <div className="text-base font-semibold">{n + 1}. {sl.nombre}{sl.zona ? ` — ${sl.zona}` : ''}</div>
            {sl.foto_url && <img src={sl.foto_url} alt="" className="my-2 max-h-72 rounded-lg object-contain" />}
            <p className="text-sm text-slate-800">{sl.texto}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Presentacion() {
  const tiendas = useStore((s) => s.tiendas);
  const toast = useStore((s) => s.toast);
  const [fecha, setFecha] = useState(hoyISO());
  const [generando, setGenerando] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [abierto, setAbierto] = useState(false);

  const tiendasMin = useMemo(() => tiendas.map((t) => ({ id: t.id_tienda, nombre: t.nombre, zona: t.zona })), [tiendas]);

  const generar = async () => {
    setGenerando(true);
    try {
      const p = await generarPresentacion(fecha, tiendasMin);
      if (!p.slides.length) toast('No hay visitas con foto u observación ese día.', 'info');
      else {
        setSlides(p.slides);
        setAbierto(true);
      }
    } catch {
      toast('No se pudo generar (¿la función de IA aún no está configurada?).', 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div>
      <div className="no-print">
        <PageTitle title="Presentación con IA" subtitle="Genera un pase de diapositivas del día con las visitas" />
        <Card className="p-5">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Día</label>
          <input
            type="date"
            value={fecha}
            max={hoyISO()}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            onClick={generar}
            disabled={generando}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <IconSpark className="h-4 w-4" />
            {generando ? 'Generando con IA… (puede tardar)' : 'Generar presentación con IA'}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            La IA redacta cada lámina con base en tus observaciones; la foto es apoyo.
          </p>
          {slides && slides.length > 0 && !abierto && (
            <button
              onClick={() => setAbierto(true)}
              className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Ver presentación ({slides.length} láminas)
            </button>
          )}
        </Card>
      </div>

      {slides && slides.length > 0 && abierto && (
        <Slideshow slides={slides} fecha={fecha} onCerrar={() => setAbierto(false)} />
      )}

      {/* Estado de carga de la IA */}
      {generando && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-slate-950/85 p-6 text-center text-white backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <div>
            <div className="text-base font-semibold">Generando presentación con IA…</div>
            <div className="mx-auto mt-1 max-w-xs text-sm text-white/70">
              La IA está analizando las fotos y redactando cada lámina con base en tus observaciones. Puede tardar unos segundos.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
