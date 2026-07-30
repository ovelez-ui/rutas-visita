import { lazy, Suspense, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { Card, PageTitle, ZonaBadge } from '../components/ui';
import { Modal } from '../components/Modal';
import { IconCheck, IconDrag, IconGo, IconMap, IconPlus, IconRefresh } from '../components/icons';
import { urlRutaCompleta } from '../lib/maps';
import { ordenarPorProximidad } from '../lib/rutas';
import { longitudRuta } from '../lib/geo';
import type { Tienda } from '../types';

const MapaDia = lazy(() => import('../components/MapaDia'));

// ── Tarjeta ordenable de un punto del recorrido ─────────────────────────────
function ItemEspecial({ tienda, orden }: { tienda: Tienda; orden: number }) {
  const visitadas = useStore((s) => s.especialVisitadas);
  const toggleVisitada = useStore((s) => s.toggleVisitadaEspecial);
  const quitar = useStore((s) => s.quitarEspecial);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tienda.id_tienda,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined };
  const visitada = visitadas.includes(tienda.id_tienda);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-3 transition ${
        isDragging ? 'border-brand-300 shadow-lg' : 'border-slate-200 dark:border-slate-800'
      } ${visitada ? 'bg-emerald-50/60 dark:bg-emerald-500/5' : 'bg-white dark:bg-slate-900'}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 grid h-8 w-5 shrink-0 cursor-grab touch-none place-items-center text-slate-300 active:cursor-grabbing dark:text-slate-600"
          aria-label="Arrastrar para reordenar"
        >
          <IconDrag className="h-5 w-5" />
        </button>
        <div
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
            visitada ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
          }`}
        >
          {visitada ? <IconCheck className="h-5 w-5" /> : orden}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-[15px] font-semibold leading-snug break-words ${
              visitada ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-white'
            }`}
          >
            {tienda.nombre}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {tienda.id_tienda}
            </span>
            <ZonaBadge zona={tienda.zona} size="xs" />
            {tienda.lat == null && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">sin ubicación</span>
            )}
          </div>
        </div>
        <button
          onClick={() => quitar(tienda.id_tienda)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          aria-label="Quitar del recorrido"
          title="Quitar"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={tienda.url_ubicacion}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Ir a la tienda <IconGo className="h-4 w-4" />
        </a>
        <button
          onClick={() => toggleVisitada(tienda.id_tienda)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
            visitada
              ? 'border-emerald-300 bg-emerald-500 text-white dark:border-emerald-500/40'
              : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-400'
          }`}
          aria-label={visitada ? 'Marcar como pendiente' : 'Marcar como visitada'}
        >
          <IconCheck className="h-5 w-5" />
          <span>{visitada ? 'Visitada' : 'Visitar'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Modal para elegir tiendas ───────────────────────────────────────────────
function SelectorTiendas({ onCerrar }: { onCerrar: () => void }) {
  const tiendas = useStore((s) => s.tiendas);
  const especial = useStore((s) => s.especial);
  const toggle = useStore((s) => s.toggleEspecialTienda);
  const [q, setQ] = useState('');
  const [zona, setZona] = useState('');

  const zonas = useMemo(() => [...new Set(tiendas.map((t) => t.zona))].sort(), [tiendas]);
  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tiendas
      .filter((t) => (zona ? t.zona === zona : true))
      .filter((t) => (term ? t.nombre.toLowerCase().includes(term) || t.id_tienda.toLowerCase().includes(term) : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tiendas, q, zona]);

  const sel = new Set(especial);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o ID…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-brand-500/20"
        />
        <select
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950 sm:w-52"
        >
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <div className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
        {filtradas.map((t) => {
          const activa = sel.has(t.id_tienda);
          return (
            <button
              key={t.id_tienda}
              onClick={() => toggle(t.id_tienda)}
              className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                activa
                  ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs ${
                  activa ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-300 text-transparent dark:border-slate-600'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{t.nombre}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{t.id_tienda} · {t.zona}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onCerrar}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Listo ({especial.length} en el recorrido)
      </button>
    </div>
  );
}

export default function RutaEspecial() {
  const tiendas = useStore((s) => s.tiendas);
  const especial = useStore((s) => s.especial);
  const visitadas = useStore((s) => s.especialVisitadas);
  const reordenar = useStore((s) => s.reordenarEspecial);
  const limpiar = useStore((s) => s.limpiarEspecial);
  const tema = useStore((s) => s.tema);
  const toast = useStore((s) => s.toast);

  const [abrirSelector, setAbrirSelector] = useState(false);
  const [verMapa, setVerMapa] = useState(true);

  const mapaTiendas = useMemo(() => new Map(tiendas.map((t) => [t.id_tienda, t])), [tiendas]);
  const puntos = useMemo(
    () => especial.map((id) => mapaTiendas.get(id)).filter((t): t is Tienda => !!t),
    [especial, mapaTiendas],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visitCount = puntos.filter((t) => visitadas.includes(t.id_tienda)).length;
  const pct = puntos.length ? Math.round((visitCount / puntos.length) * 100) : 0;
  const km = longitudRuta(puntos);
  const urlCompleta = urlRutaCompleta(puntos);
  const hayCoords = puntos.some((t) => t.lat != null);
  const visitSet = useMemo(() => new Set(visitadas), [visitadas]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = especial.indexOf(active.id as string);
    const to = especial.indexOf(over.id as string);
    reordenar(arrayMove(especial, from, to));
  };

  const optimizar = () => {
    reordenar(ordenarPorProximidad(puntos).map((t) => t.id_tienda));
    toast('Recorrido optimizado por cercanía.', 'ok');
  };

  return (
    <div>
      <PageTitle
        title="Ruta especial"
        subtitle={puntos.length ? `${puntos.length} puntos · ${visitCount} visitados · ${km.toFixed(1)} km` : 'Arma un recorrido a tu medida'}
        action={
          <button
            onClick={() => setAbrirSelector(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <IconPlus className="h-4 w-4" /> Agregar tiendas
          </button>
        }
      />

      {puntos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <IconMap className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recorrido vacío</h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Pulsa «Agregar tiendas» para elegir los puntos de venta de tu ruta especial y verlos en el mapa.
          </p>
          <button
            onClick={() => setAbrirSelector(true)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <IconPlus className="h-4 w-4" /> Agregar tiendas
          </button>
        </Card>
      ) : (
        <>
          {/* Acciones */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={optimizar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconRefresh className="h-3.5 w-3.5" /> Optimizar por cercanía
            </button>
            <button
              onClick={() => {
                if (confirm('¿Vaciar el recorrido especial?')) {
                  limpiar();
                  toast('Recorrido vaciado.', 'info');
                }
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
            >
              Vaciar
            </button>
          </div>

          {/* Progreso */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{visitCount} de {puntos.length} visitados</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Ruta completa */}
          <a
            href={urlCompleta ?? undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => !urlCompleta && e.preventDefault()}
            className={`mb-4 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
              urlCompleta
                ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
                : 'cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
            }`}
            title={urlCompleta ? 'Abrir la ruta en Google Maps' : 'Se necesitan al menos 2 tiendas con coordenadas'}
          >
            <IconMap className="h-5 w-5" /> Ver ruta completa en Maps
          </a>

          {/* Mapa */}
          {hayCoords && (
            <div className="mb-4">
              <button
                onClick={() => setVerMapa((v) => !v)}
                className="mb-2 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {verMapa ? '▲ Ocultar mapa' : '▼ Ver mapa del recorrido'}
              </button>
              {verMapa && (
                <Suspense
                  fallback={
                    <div className="grid h-72 w-full place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                      Cargando mapa…
                    </div>
                  }
                >
                  <MapaDia tiendas={puntos} visitadas={visitSet} tema={tema} />
                </Suspense>
              )}
            </div>
          )}

          {/* Lista ordenable */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={especial} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {puntos.map((t, i) => (
                  <ItemEspecial key={t.id_tienda} tienda={t} orden={i + 1} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Modal open={abrirSelector} onClose={() => setAbrirSelector(false)} title="Elegir tiendas">
        <SelectorTiendas onCerrar={() => setAbrirSelector(false)} />
      </Modal>
    </div>
  );
}
