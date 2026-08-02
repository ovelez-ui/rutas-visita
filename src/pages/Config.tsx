import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, PageTitle } from '../components/ui';
import { supabase } from '../lib/supabase';
import { confirmar } from '../lib/confirm';

function Stepper({
  label, hint, value, min, max, onChange,
}: { label: string; hint?: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-lg font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={value <= min}
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-lg font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Config() {
  const tiendas = useStore((s) => s.tiendas);
  const plan = useStore((s) => s.plan);
  const tema = useStore((s) => s.tema);
  const toggleTema = useStore((s) => s.toggleTema);
  const reset = useStore((s) => s.resetSemilla);
  const opciones = useStore((s) => s.opciones);
  const setOpciones = useStore((s) => s.setOpciones);
  const toast = useStore((s) => s.toast);

  const [correo, setCorreo] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCorreo(data.user?.email ?? null));
  }, []);

  const zonas = new Set(tiendas.map((t) => t.zona)).size;

  return (
    <div>
      <PageTitle title="Ajustes" subtitle="Preferencias, generación de rutas y datos" />

      <div className="space-y-3">
        {/* Parámetros de rutas */}
        <Card className="p-4">
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Generación de rutas</div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Stepper
              label="Mínimo de paradas por día"
              hint="Se avisa si un día queda por debajo"
              value={opciones.min}
              min={1}
              max={opciones.max}
              onChange={(v) => setOpciones({ min: v })}
            />
            <Stepper
              label="Máximo de paradas por día"
              hint="Tope de visitas diarias"
              value={opciones.max}
              min={opciones.min}
              max={12}
              onChange={(v) => setOpciones({ max: v })}
            />
            <Stepper
              label="Radio para combinar zonas (km)"
              hint="Distancia máx. para unir días cortos de zonas vecinas"
              value={opciones.radioMezclaKm}
              min={0}
              max={50}
              onChange={(v) => setOpciones({ radioMezclaKm: v })}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Los cambios aplican al pulsar «Generar rutas» en la pestaña Rutas.
          </p>
        </Card>

        {/* Tema */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Tema</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Claro u oscuro</div>
          </div>
          <button
            onClick={toggleTema}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium capitalize transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {tema}
          </button>
        </Card>

        {/* Datos */}
        <Card className="p-4">
          <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Datos</div>
          <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {tiendas.length} tiendas · {zonas} zonas · {plan ? `${plan.dias.length} días planificados` : 'sin plan'}
          </div>
          <button
            onClick={async () => {
              if (
                await confirmar({
                  titulo: 'Restaurar datos de ejemplo',
                  mensaje: 'Se perderán los cambios locales y el plan generado.',
                  textoOk: 'Restaurar',
                  peligro: true,
                })
              ) {
                reset();
                toast('Datos restaurados a la semilla.', 'info');
              }
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
          >
            Restaurar tiendas de ejemplo
          </button>
        </Card>

        {/* Cuenta */}
        {correo && (
          <Card className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Sesión</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{correo}</div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                location.reload();
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
            >
              Cerrar sesión
            </button>
          </Card>
        )}

        <p className="px-1 text-center text-[11px] text-slate-400">
          Rutas de Visita · v1 · Datos en la nube (Supabase).
        </p>
      </div>
    </div>
  );
}
