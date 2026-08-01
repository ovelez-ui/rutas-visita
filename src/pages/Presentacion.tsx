import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle } from '../components/ui';
import { IconSpark } from '../components/icons';
import { generarPresentacion, type Slide } from '../lib/presentacion';
import { hoyISO } from '../lib/viaticos';

// Pase de diapositivas a pantalla completa
function Slideshow({ slides, fecha, onCerrar }: { slides: Slide[]; fecha: string; onCerrar: () => void }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const fmt = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-medium">
          Presentación · <span className="text-white/70">{fmt}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-white/60">{i + 1} / {slides.length}</span>
          <button onClick={onCerrar} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10" aria-label="Cerrar">✕</button>
        </div>
      </div>

      {/* Lámina */}
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

      {/* Controles */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-30"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))}
          disabled={i === slides.length - 1}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-700 disabled:opacity-30"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default function Presentacion() {
  const tiendas = useStore((s) => s.tiendas);
  const toast = useStore((s) => s.toast);
  const [fecha, setFecha] = useState(hoyISO());
  const [generando, setGenerando] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);

  const tiendasMin = useMemo(
    () => tiendas.map((t) => ({ id: t.id_tienda, nombre: t.nombre, zona: t.zona })),
    [tiendas],
  );

  const generar = async () => {
    setGenerando(true);
    try {
      const p = await generarPresentacion(fecha, tiendasMin);
      if (!p.slides.length) {
        toast('No hay visitas con foto u observación ese día.', 'info');
      } else {
        setSlides(p.slides);
      }
    } catch {
      toast('No se pudo generar (¿la función de IA aún no está configurada?).', 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div>
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
          La IA analiza las fotos y observaciones de ese día para redactar cada lámina.
        </p>
      </Card>

      {slides && slides.length > 0 && (
        <Slideshow slides={slides} fecha={fecha} onCerrar={() => setSlides(null)} />
      )}
    </div>
  );
}
