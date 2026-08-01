import { useEffect, useMemo, useState } from 'react';
import { Card, PageTitle } from '../components/ui';
import { IconPlus, IconTrash, IconWallet } from '../components/icons';
import { useStore } from '../store/useStore';
import {
  agregarViatico,
  eliminarViatico,
  listarViaticos,
  formatoCOP,
  hoyISO,
  CATEGORIAS,
  type Viatico,
} from '../lib/viaticos';

export default function Viaticos() {
  const toast = useStore((s) => s.toast);
  const [items, setItems] = useState<Viatico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dia, setDia] = useState(hoyISO());

  // Formulario
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setItems(await listarViaticos());
    } catch {
      toast('No se pudieron cargar los viáticos.', 'error');
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const delDia = useMemo(() => items.filter((v) => v.fecha === dia), [items, dia]);
  const totalDia = delDia.reduce((s, v) => s + Number(v.monto || 0), 0);

  // Resumen por día (para saltar rápido entre días)
  const porDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of items) m.set(v.fecha, (m.get(v.fecha) ?? 0) + Number(v.monto || 0));
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
  }, [items]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monto.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!concepto.trim() || isNaN(m) || m <= 0) {
      toast('Escribe un concepto y un monto válido.', 'error');
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await agregarViatico({ fecha: dia, concepto: concepto.trim(), monto: m, categoria });
      setItems((prev) => [nuevo, ...prev]);
      setConcepto('');
      setMonto('');
      toast('Gasto agregado.', 'ok');
    } catch {
      toast('No se pudo guardar (¿sin conexión?).', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (v: Viatico) => {
    if (!confirm(`¿Eliminar "${v.concepto}" (${formatoCOP(v.monto)})?`)) return;
    try {
      await eliminarViatico(v.id);
      setItems((prev) => prev.filter((x) => x.id !== v.id));
      toast('Gasto eliminado.', 'info');
    } catch {
      toast('No se pudo eliminar.', 'error');
    }
  };

  const fmtDia = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div>
      <PageTitle title="Viáticos" subtitle="Registra los gastos del día" />

      {/* Selector de día + total (contador) */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Día</label>
          <input
            type="date"
            value={dia}
            max={hoyISO()}
            onChange={(e) => setDia(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div className="flex items-center justify-between gap-3 bg-brand-600 p-5 text-white">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-white/80">Total del día</div>
            <div className="text-3xl font-bold tabular-nums">{formatoCOP(totalDia)}</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <IconWallet className="h-6 w-6" />
          </div>
        </div>
      </Card>

      {/* Formulario */}
      <Card className="mb-4 p-4">
        <form onSubmit={agregar} className="space-y-2.5">
          <input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Concepto (ej. Taxi al centro)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-brand-500/20"
          />
          <div className="flex gap-2">
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Monto"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-brand-500/20"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-40 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <IconPlus className="h-4 w-4" /> {guardando ? 'Guardando…' : 'Agregar gasto'}
          </button>
        </form>
      </Card>

      {/* Lista del día */}
      {cargando ? (
        <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</Card>
      ) : delDia.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Sin gastos registrados para {fmtDia(dia)}.
        </Card>
      ) : (
        <div className="space-y-2">
          {delDia.map((v) => (
            <Card key={v.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{v.concepto}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{v.categoria}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatoCOP(v.monto)}</span>
                <button
                  onClick={() => borrar(v)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label="Eliminar"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen de otros días */}
      {porDia.length > 1 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Días recientes</h2>
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {porDia.map(([f, total]) => (
              <button
                key={f}
                onClick={() => setDia(f)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  f === dia ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''
                }`}
              >
                <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{fmtDia(f)}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatoCOP(total)}</span>
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
