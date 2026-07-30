import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { IconCamera, IconMail, IconTrash } from './icons';
import { useStore } from '../store/useStore';
import { comprimirImagen, getVisita, saveVisita, resumen, sincronizarVisita, type Visita } from '../lib/visitas';
import { abrirCorreo, correoIndividual } from '../lib/correo';

// Botón que muestra el estado del registro (fotos/observaciones) de un punto
// y abre el modal para capturar fotos y escribir observaciones.
export function RegistroVisita({ idTienda, nombre, zona }: { idTienda: string; nombre: string; zona?: string }) {
  const reg = useStore((s) => s.registros[idTienda]);
  const setRegistro = useStore((s) => s.setRegistro);
  const toast = useStore((s) => s.toast);

  const [open, setOpen] = useState(false);
  const [visita, setVisita] = useState<Visita | null>(null);
  const [cargando, setCargando] = useState(false);
  const [sinc, setSinc] = useState<'ok' | 'pend' | 'subiendo'>('ok');
  const inputRef = useRef<HTMLInputElement>(null);

  const tieneDatos = reg && (reg.fotos > 0 || reg.obs);

  const abrir = async () => {
    setOpen(true);
    const v = await getVisita(idTienda);
    setVisita(v);
    const pendiente = (v.fotos.length > 0 || v.observaciones) && v.actualizado !== v.sincronizado;
    setSinc(pendiente ? 'pend' : 'ok');
    if (pendiente) sincronizar(v); // reintenta subir lo que quedó local
  };

  // Guarda solo en el dispositivo (instantáneo, offline)
  const persistirLocal = async (v: Visita) => {
    v.actualizado = new Date().toISOString();
    setVisita({ ...v });
    await saveVisita(idTienda, v);
    setRegistro(idTienda, resumen(v));
    setSinc('pend');
    return v;
  };

  // Sube a la nube (fotos al bucket + fila en la tabla)
  const sincronizar = async (v: Visita) => {
    if (!v.fotos.length && !v.observaciones.trim()) {
      setSinc('ok');
      return;
    }
    setSinc('subiendo');
    const { visita: actualizada, ok } = await sincronizarVisita(idTienda, v);
    if (ok) {
      setVisita({ ...actualizada });
      setSinc('ok');
    } else {
      setSinc('pend');
    }
  };

  const onFiles = async (files: FileList) => {
    if (!visita) return;
    setCargando(true);
    try {
      const nuevas = [];
      for (const file of Array.from(files)) {
        const dataUrl = await comprimirImagen(file);
        nuevas.push({ id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, dataUrl, fecha: new Date().toISOString() });
      }
      const v = await persistirLocal({ ...visita, fotos: [...visita.fotos, ...nuevas] });
      sincronizar(v); // las fotos se suben de inmediato
    } catch {
      toast('No se pudo procesar alguna foto.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const borrarFoto = async (id: string) => {
    if (!visita) return;
    const v = await persistirLocal({ ...visita, fotos: visita.fotos.filter((f) => f.id !== id) });
    sincronizar(v);
  };

  const guardarObs = async (texto: string) => {
    if (!visita) return;
    await persistirLocal({ ...visita, observaciones: texto }); // sube al cerrar
  };

  const cerrar = () => {
    setOpen(false);
    if (sinc === 'pend' && visita) sincronizar(visita);
  };

  return (
    <>
      <button
        onClick={abrir}
        className={`relative inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition ${
          tieneDatos
            ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
        aria-label="Registro de visita: fotos y observaciones"
      >
        <IconCamera className="h-4 w-4" />
        {tieneDatos ? (
          <span className="tabular-nums">
            {reg.fotos > 0 && `${reg.fotos}📷`}
            {reg.obs && ' 📝'}
          </span>
        ) : (
          <span>Registrar</span>
        )}
      </button>

      <Modal open={open} onClose={cerrar} title="Registro de visita">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{nombre}</div>

          {/* Fotos */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Fotos {visita ? `(${visita.fotos.length})` : ''}
              </span>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                <IconCamera className="h-4 w-4" /> {cargando ? 'Procesando…' : 'Agregar foto'}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onFiles(e.target.files);
                e.target.value = '';
              }}
            />
            {visita && visita.fotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {visita.fotos.map((f) => (
                  <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <img src={f.dataUrl} alt="foto de visita" className="h-full w-full object-cover" />
                    <button
                      onClick={() => borrarFoto(f.id)}
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-white opacity-90 transition hover:bg-rose-600"
                      aria-label="Borrar foto"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                Toca «Agregar foto» para usar la cámara o la galería.
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Observaciones</label>
            <textarea
              value={visita?.observaciones ?? ''}
              onChange={(e) => guardarObs(e.target.value)}
              rows={4}
              placeholder="Notas de la visita: exhibición, inventario, oportunidades…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-brand-500/20"
            />
          </div>

          {/* Enviar por correo (desde la cuenta del usuario) */}
          {visita && (visita.fotos.length > 0 || visita.observaciones.trim()) && (
            <button
              onClick={() => {
                const { subject, body } = correoIndividual(idTienda, { nombre, zona }, visita);
                abrirCorreo(subject, body);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <IconMail className="h-4 w-4" /> Enviar por correo
            </button>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium">
              {sinc === 'subiendo' && <span className="text-slate-400">☁️ Subiendo a la nube…</span>}
              {sinc === 'ok' && <span className="text-emerald-600 dark:text-emerald-400">☁️ Guardado en la nube</span>}
              {sinc === 'pend' && <span className="text-amber-600 dark:text-amber-400">⏳ Guardado local · se subirá al reconectar</span>}
            </span>
            <button
              onClick={cerrar}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Listo
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
