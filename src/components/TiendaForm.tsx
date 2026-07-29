import { useState } from 'react';
import type { Tienda } from '../types';
import { validarTienda, extraerCoords, type Errores } from '../lib/tiendas';

const inputCls =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 dark:bg-slate-950';
const okCls = 'border-slate-200 focus:border-brand-400 focus:ring-brand-100 dark:border-slate-700 dark:focus:ring-brand-500/20';
const errCls = 'border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/50';

function Campo({
  label, children, error, hint,
}: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function TiendaForm({
  inicial,
  idsExistentes,
  zonasExistentes,
  onGuardar,
  onCancelar,
}: {
  inicial?: Tienda;
  idsExistentes: string[]; // ids de otras tiendas (para validar unicidad)
  zonasExistentes: string[];
  onGuardar: (t: Tienda) => void;
  onCancelar: () => void;
}) {
  const editando = !!inicial;
  const [f, setF] = useState<Partial<Tienda>>(
    inicial ?? { id_tienda: '', nombre: '', zona: '', url_ubicacion: '', lat: null, lng: null },
  );
  const [err, setErr] = useState<Errores>({});

  const set = (k: keyof Tienda, v: string) =>
    setF((p) => ({ ...p, [k]: k === 'lat' || k === 'lng' ? (v === '' ? null : Number(v)) : v }));

  const autodetectar = () => {
    const c = extraerCoords(f.url_ubicacion ?? '');
    if (c) setF((p) => ({ ...p, lat: c.lat, lng: c.lng }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validarTienda(f, idsExistentes);
    setErr(errs);
    if (Object.keys(errs).length) return;
    onGuardar({
      id_tienda: (f.id_tienda ?? '').trim(),
      nombre: (f.nombre ?? '').trim(),
      zona: (f.zona ?? '').trim(),
      url_ubicacion: (f.url_ubicacion ?? '').trim(),
      lat: f.lat ?? null,
      lng: f.lng ?? null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Campo label="ID *" error={err.id_tienda}>
            <input
              className={`${inputCls} ${err.id_tienda ? errCls : okCls}`}
              value={f.id_tienda ?? ''}
              onChange={(e) => set('id_tienda', e.target.value)}
              placeholder="T001"
              disabled={editando}
            />
          </Campo>
        </div>
        <div className="col-span-2">
          <Campo label="Nombre *" error={err.nombre}>
            <input
              className={`${inputCls} ${err.nombre ? errCls : okCls}`}
              value={f.nombre ?? ''}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Farmacia Pasteur Centro"
            />
          </Campo>
        </div>
      </div>

      <Campo label="Zona *" error={err.zona} hint="Base para agrupar las rutas">
        <input
          className={`${inputCls} ${err.zona ? errCls : okCls}`}
          value={f.zona ?? ''}
          onChange={(e) => set('zona', e.target.value)}
          placeholder="BELLO"
          list="zonas-list"
        />
        <datalist id="zonas-list">
          {zonasExistentes.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </Campo>

      <Campo label="URL de ubicación *" error={err.url_ubicacion}>
        <input
          className={`${inputCls} ${err.url_ubicacion ? errCls : okCls}`}
          value={f.url_ubicacion ?? ''}
          onChange={(e) => set('url_ubicacion', e.target.value)}
          placeholder="https://maps.app.goo.gl/…"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Latitud" error={err.lat} hint="Opcional">
          <input
            className={`${inputCls} ${err.lat ? errCls : okCls}`}
            value={f.lat ?? ''}
            onChange={(e) => set('lat', e.target.value)}
            placeholder="6.1530"
            inputMode="decimal"
          />
        </Campo>
        <Campo label="Longitud" error={err.lng} hint="Opcional">
          <input
            className={`${inputCls} ${err.lng ? errCls : okCls}`}
            value={f.lng ?? ''}
            onChange={(e) => set('lng', e.target.value)}
            placeholder="-75.5378"
            inputMode="decimal"
          />
        </Campo>
      </div>
      <button
        type="button"
        onClick={autodetectar}
        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        Intentar detectar coordenadas desde la URL
      </button>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {editando ? 'Guardar cambios' : 'Crear tienda'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
