import { useRef, useState } from 'react';
import { importarArchivo, type ResultadoImport } from '../lib/importar';
import { useStore } from '../store/useStore';
import { IconUpload } from './icons';

export function ImportDialog({ onCerrar }: { onCerrar: () => void }) {
  const upsertMany = useStore((s) => s.upsertMany);
  const toast = useStore((s) => s.toast);
  const tiendasActuales = useStore((s) => s.tiendas);

  const [res, setRes] = useState<ResultadoImport | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const idsActuales = new Set(tiendasActuales.map((t) => t.id_tienda));

  const onFile = async (file: File) => {
    setCargando(true);
    setNombreArchivo(file.name);
    try {
      const r = await importarArchivo(file);
      setRes(r);
    } catch {
      toast('No se pudo leer el archivo. ¿Es un CSV o Excel válido?', 'error');
    } finally {
      setCargando(false);
    }
  };

  const confirmar = () => {
    if (!res) return;
    const { nuevas, actualizadas } = upsertMany(res.tiendas);
    toast(`Importadas: ${nuevas} nuevas, ${actualizadas} actualizadas.`, 'ok');
    onCerrar();
  };

  const nuevas = res ? res.tiendas.filter((t) => !idsActuales.has(t.id_tienda)).length : 0;
  const actualizadas = res ? res.tiendas.length - nuevas : 0;
  const conCoords = res ? res.tiendas.filter((t) => t.lat != null).length : 0;

  return (
    <div className="space-y-4">
      {/* Zona de carga */}
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-slate-500 transition hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-brand-500"
      >
        <IconUpload className="h-8 w-8" />
        <span className="text-sm font-medium">
          {cargando ? 'Leyendo…' : 'Selecciona un archivo CSV o Excel'}
        </span>
        <span className="text-xs text-slate-400">Columnas: id_tienda, nombre, zona, url_ubicacion</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />

      {/* Resultado */}
      {res && (
        <div className="space-y-3">
          {res.columnasFaltantes.length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              Faltan columnas obligatorias: <b>{res.columnasFaltantes.join(', ')}</b>. Revisa los
              encabezados del archivo.
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                <div className="mb-1 font-medium text-slate-700 dark:text-slate-200">
                  {nombreArchivo} · {res.totalFilas} filas leídas
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
                  <span>✓ {res.tiendas.length} válidas</span>
                  <span className="text-emerald-600 dark:text-emerald-400">+{nuevas} nuevas</span>
                  <span className="text-brand-600 dark:text-brand-400">↻ {actualizadas} actualizadas</span>
                  <span>📍 {conCoords} con coordenadas</span>
                </div>
              </div>

              {res.errores.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <div className="mb-1 font-semibold">{res.errores.length} filas con avisos:</div>
                  <ul className="list-inside list-disc space-y-0.5">
                    {res.errores.slice(0, 30).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {res.errores.length > 30 && <li>… y {res.errores.length - 30} más</li>}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={confirmar}
          disabled={!res || res.tiendas.length === 0}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Importar {res && res.tiendas.length > 0 ? `${res.tiendas.length} tiendas` : ''}
        </button>
        <button
          onClick={onCerrar}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
