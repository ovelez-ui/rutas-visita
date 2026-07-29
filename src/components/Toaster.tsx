import { useStore } from '../store/useStore';

const ESTILO = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  info: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300',
} as const;

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto w-full max-w-sm cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${ESTILO[t.tipo]}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
