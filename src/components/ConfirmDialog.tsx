import { useEffect } from 'react';
import { responderConfirm, useConfirm } from '../lib/confirm';

// Diálogo de confirmación global, con el estilo de la app.
export function ConfirmDialog() {
  const opts = useConfirm((s) => s.opts);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') responderConfirm(false);
      if (e.key === 'Enter') responderConfirm(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts]);

  if (!opts) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => responderConfirm(false)} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{opts.titulo}</h2>
        {opts.mensaje && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{opts.mensaje}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => responderConfirm(false)}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => responderConfirm(true)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
              opts.peligro ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {opts.textoOk ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
