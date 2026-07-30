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
import type { DiaRuta, Tienda } from '../types';
import { useStore } from '../store/useStore';
import { ZonaBadge } from './ui';
import { IconCheck, IconDrag, IconGo, IconMap, IconRefresh, IconSpark } from './icons';
import { urlRutaCompleta } from '../lib/maps';
import { ordenarPorProximidad, kmDia } from '../lib/rutas';
import { mensajeDelDia } from '../lib/motivacion';
import { RegistroVisita } from './RegistroVisita';

const MapaDia = lazy(() => import('./MapaDia'));

function ParadaItem({
  parada,
  tienda,
  dia,
}: {
  parada: DiaRuta['paradas'][number];
  tienda?: Tienda;
  dia: number;
}) {
  const toggleVisitada = useStore((s) => s.toggleVisitada);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: parada.id_tienda,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const visitada = parada.visitada;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-3 transition ${
        isDragging ? 'border-brand-300 shadow-lg' : 'border-slate-200 dark:border-slate-800'
      } ${visitada ? 'bg-emerald-50/60 dark:bg-emerald-500/5' : 'bg-white dark:bg-slate-900'}`}
    >
      {/* Fila superior: asa + número + nombre (a todo el ancho) */}
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
            visitada
              ? 'bg-emerald-500 text-white'
              : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
          }`}
        >
          {visitada ? <IconCheck className="h-5 w-5" /> : parada.orden}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`text-[15px] font-semibold leading-snug break-words ${
              visitada ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-white'
            }`}
          >
            {tienda?.nombre ?? parada.id_tienda}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {parada.id_tienda}
            </span>
            {tienda && <ZonaBadge zona={tienda.zona} size="xs" />}
            {tienda && tienda.lat == null && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">sin ubicación</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <RegistroVisita idTienda={parada.id_tienda} nombre={tienda?.nombre ?? parada.id_tienda} zona={tienda?.zona} />
        </div>
      </div>

      {/* Fila inferior: acciones grandes */}
      <div className="mt-3 flex gap-2">
        <a
          href={tienda?.url_ubicacion}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Ir a la tienda <IconGo className="h-4 w-4" />
        </a>
        <button
          onClick={() => toggleVisitada(dia, parada.id_tienda)}
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

export function RutaDia({ dia }: { dia: DiaRuta }) {
  const tiendas = useStore((s) => s.tiendas);
  const reordenarDia = useStore((s) => s.reordenarDia);
  const toast = useStore((s) => s.toast);
  const tema = useStore((s) => s.tema);
  const [verMapa, setVerMapa] = useState(false);

  const mapaTiendas = useMemo(() => new Map(tiendas.map((t) => [t.id_tienda, t])), [tiendas]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const paradasOrdenadas = useMemo(
    () => dia.paradas.slice().sort((a, b) => a.orden - b.orden),
    [dia.paradas],
  );
  const ids = paradasOrdenadas.map((p) => p.id_tienda);

  const visitadas = dia.paradas.filter((p) => p.visitada).length;
  const total = dia.paradas.length;
  const pct = total ? Math.round((visitadas / total) * 100) : 0;

  const tiendasEnOrden = paradasOrdenadas
    .map((p) => mapaTiendas.get(p.id_tienda))
    .filter((t): t is Tienda => !!t);
  const urlCompleta = urlRutaCompleta(tiendasEnOrden);
  const km = kmDia(dia, mapaTiendas);
  const visitadasSet = useMemo(
    () => new Set(dia.paradas.filter((p) => p.visitada).map((p) => p.id_tienda)),
    [dia.paradas],
  );
  const hayCoords = tiendasEnOrden.some((t) => t.lat != null);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    reordenarDia(dia.dia, arrayMove(ids, from, to));
  };

  const reoptimizar = () => {
    const nuevas = ordenarPorProximidad(tiendasEnOrden);
    reordenarDia(dia.dia, nuevas.map((t) => t.id_tienda));
    toast('Orden recalculado por proximidad.', 'ok');
  };

  return (
    <div>
      {/* Mensaje motivacional para la Coordinadora Dermo */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 p-4 text-white shadow-sm">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
          <IconSpark className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium leading-snug">{mensajeDelDia(dia.dia)}</p>
      </div>

      {/* Cabecera del día */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {dia.zonas.map((z) => (
            <ZonaBadge key={z} zona={z} />
          ))}
          <span className="text-xs text-slate-400">· {km.toFixed(1)} km</span>
        </div>
        <button
          onClick={reoptimizar}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Recalcular el orden por proximidad"
        >
          <IconRefresh className="h-3.5 w-3.5" /> Reoptimizar
        </button>
      </div>

      {/* Progreso */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            {visitadas} de {total} visitadas
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Ruta completa en Maps */}
      <a
        href={urlCompleta ?? undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!urlCompleta}
        onClick={(e) => !urlCompleta && e.preventDefault()}
        className={`mb-4 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
          urlCompleta
            ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
            : 'cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600'
        }`}
        title={urlCompleta ? 'Abrir la ruta del día en Google Maps' : 'Se necesitan al menos 2 tiendas con coordenadas'}
      >
        <IconMap className="h-5 w-5" /> Ver ruta completa del día
      </a>

      {/* Mapa embebido */}
      {hayCoords && (
        <div className="mb-4">
          <button
            onClick={() => setVerMapa((v) => !v)}
            className="mb-2 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {verMapa ? '▲ Ocultar mapa' : '▼ Ver mapa del día'}
          </button>
          {verMapa && (
            <Suspense
              fallback={
                <div className="grid h-72 w-full place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  Cargando mapa…
                </div>
              }
            >
              <MapaDia tiendas={tiendasEnOrden} visitadas={visitadasSet} tema={tema} />
            </Suspense>
          )}
        </div>
      )}

      {/* Lista ordenable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {paradasOrdenadas.map((p) => (
              <ParadaItem key={p.id_tienda} parada={p} tienda={mapaTiendas.get(p.id_tienda)} dia={dia.dia} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Arrastra por el asa <span className="align-middle">⠿</span> para reordenar · «Reoptimizar» recalcula por distancia
      </p>
    </div>
  );
}
