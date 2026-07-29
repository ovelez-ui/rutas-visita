import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle, ZonaBadge } from '../components/ui';
import { IconPin, IconPlus, IconUpload } from '../components/icons';
import { Modal } from '../components/Modal';
import { TiendaForm } from '../components/TiendaForm';
import { ImportDialog } from '../components/ImportDialog';
import { exportarCSV } from '../lib/importar';
import type { Tienda } from '../types';

export default function Tiendas() {
  const tiendas = useStore((s) => s.tiendas);
  const addTienda = useStore((s) => s.addTienda);
  const updateTienda = useStore((s) => s.updateTienda);
  const removeTienda = useStore((s) => s.removeTienda);
  const toast = useStore((s) => s.toast);

  const [q, setQ] = useState('');
  const [zona, setZona] = useState('');
  const [modal, setModal] = useState<'nueva' | 'editar' | 'importar' | null>(null);
  const [editando, setEditando] = useState<Tienda | null>(null);

  const zonas = useMemo(() => [...new Set(tiendas.map((t) => t.zona))].sort(), [tiendas]);

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tiendas
      .filter((t) => (zona ? t.zona === zona : true))
      .filter((t) =>
        term ? t.nombre.toLowerCase().includes(term) || t.id_tienda.toLowerCase().includes(term) : true,
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tiendas, q, zona]);

  const abrirNueva = () => {
    setEditando(null);
    setModal('nueva');
  };
  const abrirEditar = (t: Tienda) => {
    setEditando(t);
    setModal('editar');
  };

  const guardar = (t: Tienda) => {
    if (modal === 'editar' && editando) {
      updateTienda(editando.id_tienda, t);
      toast('Tienda actualizada.', 'ok');
    } else {
      addTienda(t);
      toast('Tienda creada.', 'ok');
    }
    setModal(null);
    setEditando(null);
  };

  const eliminar = (t: Tienda) => {
    if (confirm(`¿Eliminar "${t.nombre}" (${t.id_tienda})?`)) {
      removeTienda(t.id_tienda);
      toast('Tienda eliminada.', 'info');
    }
  };

  return (
    <div>
      <PageTitle
        title="Tiendas"
        subtitle={`${tiendas.length} tiendas en ${zonas.length} zonas`}
        action={
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => setModal('importar')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <IconUpload className="h-4 w-4" /> Importar
            </button>
            <button
              onClick={abrirNueva}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <IconPlus className="h-4 w-4" /> Nueva tienda
            </button>
          </div>
        }
      />

      {/* Controles */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o ID…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-brand-500/20"
        />
        <select
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 sm:w-64"
        >
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      {/* Acciones móviles */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:hidden">
        <button
          onClick={() => setModal('importar')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium dark:border-slate-700"
        >
          <IconUpload className="h-4 w-4" /> Importar
        </button>
        <button
          onClick={abrirNueva}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white"
        >
          <IconPlus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {filtradas.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tiendas.length === 0 ? 'Aún no hay tiendas. Crea una o importa un archivo.' : 'No se encontraron tiendas con ese filtro.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtradas.map((t) => (
            <Card key={t.id_tienda} className="group flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {t.id_tienda}
                  </span>
                  {t.lat == null && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">sin ubicación</span>
                  )}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{t.nombre}</div>
                <div className="mt-1.5">
                  <ZonaBadge zona={t.zona} size="xs" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => abrirEditar(t)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Editar"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={() => eliminar(t)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label="Eliminar"
                  title="Eliminar"
                >
                  🗑
                </button>
                <a
                  href={t.url_ubicacion}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                  aria-label="Abrir ubicación"
                  title="Abrir en Maps"
                >
                  <IconPin className="h-5 w-5" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Exportar */}
      {tiendas.length > 0 && (
        <div className="mt-5 text-center">
          <button
            onClick={() => exportarCSV(tiendas)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline dark:hover:text-slate-300"
          >
            Exportar todas a CSV
          </button>
        </div>
      )}

      {/* Modales */}
      <Modal
        open={modal === 'nueva' || modal === 'editar'}
        onClose={() => setModal(null)}
        title={modal === 'editar' ? 'Editar tienda' : 'Nueva tienda'}
      >
        <TiendaForm
          inicial={editando ?? undefined}
          idsExistentes={tiendas.filter((t) => t.id_tienda !== editando?.id_tienda).map((t) => t.id_tienda)}
          zonasExistentes={zonas}
          onGuardar={guardar}
          onCancelar={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === 'importar'} onClose={() => setModal(null)} title="Importar tiendas">
        <ImportDialog onCerrar={() => setModal(null)} />
      </Modal>
    </div>
  );
}
