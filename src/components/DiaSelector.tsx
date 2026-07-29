import type { PlanRutas } from '../types';
import { colorZona } from '../lib/zonas';

export function DiaSelector({
  plan,
  seleccionado,
  onSelect,
}: {
  plan: PlanRutas;
  seleccionado: number;
  onSelect: (dia: number) => void;
}) {
  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {plan.dias.map((d) => {
        const visit = d.paradas.filter((p) => p.visitada).length;
        const total = d.paradas.length;
        const completo = visit === total && total > 0;
        const activo = d.dia === seleccionado;
        const corto = total < plan.objetivoMin;
        const c = colorZona(d.zonas[0]);

        return (
          <button
            key={d.dia}
            onClick={() => onSelect(d.dia)}
            className={`relative flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition ${
              activo
                ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <span className="text-sm font-bold">D{d.dia}</span>
            <span className={`mt-0.5 flex items-center gap-1 text-[10px] font-medium ${activo ? 'text-white/80' : 'text-slate-400'}`}>
              {completo ? '✓ listo' : `${visit}/${total}`}
            </span>
            {/* Acento de zona / estado */}
            <span
              className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${
                completo ? 'bg-emerald-500' : corto ? 'bg-amber-400' : activo ? 'bg-white' : c.dot
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
