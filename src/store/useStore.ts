import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanRutas, Tienda } from '../types';
import { OPCIONES_DEFECTO, type OpcionesRuta } from '../lib/rutas';
import seed from '../data/tiendas.seed.json';

const seedTiendas = seed as Tienda[];

export type Toast = { id: number; msg: string; tipo: 'ok' | 'error' | 'info' };

interface AppState {
  tiendas: Tienda[];
  plan: PlanRutas | null;
  tema: 'claro' | 'oscuro';
  toasts: Toast[];
  opciones: OpcionesRuta;
  setOpciones: (o: Partial<OpcionesRuta>) => void;

  // Tiendas
  setTiendas: (t: Tienda[]) => void;
  addTienda: (t: Tienda) => void;
  updateTienda: (id: string, t: Partial<Tienda>) => void;
  removeTienda: (id: string) => void;
  upsertMany: (t: Tienda[]) => { nuevas: number; actualizadas: number };

  // Rutas
  setPlan: (p: PlanRutas | null) => void;
  toggleVisitada: (dia: number, idTienda: string) => void;
  reordenarDia: (dia: number, idsEnOrden: string[]) => void;

  // Ruta especial (recorrido manual)
  especial: string[]; // ids en orden
  especialVisitadas: string[]; // ids marcados como visitados
  toggleEspecialTienda: (id: string) => void; // agrega o quita del recorrido
  reordenarEspecial: (idsEnOrden: string[]) => void;
  quitarEspecial: (id: string) => void;
  toggleVisitadaEspecial: (id: string) => void;
  limpiarEspecial: () => void;

  // UI
  toggleTema: () => void;
  resetSemilla: () => void;
  toast: (msg: string, tipo?: Toast['tipo']) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      tiendas: seedTiendas,
      plan: null,
      tema: 'claro',
      toasts: [],
      opciones: OPCIONES_DEFECTO,
      setOpciones: (o) => set((s) => ({ opciones: { ...s.opciones, ...o } })),

      setTiendas: (t) => set({ tiendas: t }),
      addTienda: (t) => set((s) => ({ tiendas: [...s.tiendas, t] })),
      updateTienda: (id, patch) =>
        set((s) => ({
          tiendas: s.tiendas.map((x) => (x.id_tienda === id ? { ...x, ...patch } : x)),
        })),
      removeTienda: (id) =>
        set((s) => ({ tiendas: s.tiendas.filter((x) => x.id_tienda !== id) })),
      upsertMany: (entrantes) => {
        let nuevas = 0;
        let actualizadas = 0;
        set((s) => {
          const mapa = new Map(s.tiendas.map((t) => [t.id_tienda, t]));
          for (const t of entrantes) {
            if (mapa.has(t.id_tienda)) {
              actualizadas++;
              mapa.set(t.id_tienda, { ...mapa.get(t.id_tienda)!, ...t });
            } else {
              nuevas++;
              mapa.set(t.id_tienda, t);
            }
          }
          return { tiendas: [...mapa.values()] };
        });
        return { nuevas, actualizadas };
      },

      setPlan: (plan) => set({ plan }),
      toggleVisitada: (dia, idTienda) =>
        set((s) => {
          if (!s.plan) return {};
          const dias = s.plan.dias.map((d) =>
            d.dia !== dia
              ? d
              : {
                  ...d,
                  paradas: d.paradas.map((p) =>
                    p.id_tienda === idTienda ? { ...p, visitada: !p.visitada } : p,
                  ),
                },
          );
          return { plan: { ...s.plan, dias } };
        }),
      reordenarDia: (dia, idsEnOrden) =>
        set((s) => {
          if (!s.plan) return {};
          const dias = s.plan.dias.map((d) => {
            if (d.dia !== dia) return d;
            const porId = new Map(d.paradas.map((p) => [p.id_tienda, p]));
            const paradas = idsEnOrden
              .map((id, i) => {
                const p = porId.get(id);
                return p ? { ...p, orden: i + 1 } : null;
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);
            return { ...d, paradas };
          });
          return { plan: { ...s.plan, dias } };
        }),

      // ── Ruta especial ──
      especial: [],
      especialVisitadas: [],
      toggleEspecialTienda: (id) =>
        set((s) =>
          s.especial.includes(id)
            ? {
                especial: s.especial.filter((x) => x !== id),
                especialVisitadas: s.especialVisitadas.filter((x) => x !== id),
              }
            : { especial: [...s.especial, id] },
        ),
      reordenarEspecial: (idsEnOrden) => set({ especial: idsEnOrden }),
      quitarEspecial: (id) =>
        set((s) => ({
          especial: s.especial.filter((x) => x !== id),
          especialVisitadas: s.especialVisitadas.filter((x) => x !== id),
        })),
      toggleVisitadaEspecial: (id) =>
        set((s) => ({
          especialVisitadas: s.especialVisitadas.includes(id)
            ? s.especialVisitadas.filter((x) => x !== id)
            : [...s.especialVisitadas, id],
        })),
      limpiarEspecial: () => set({ especial: [], especialVisitadas: [] }),

      toggleTema: () => set((s) => ({ tema: s.tema === 'claro' ? 'oscuro' : 'claro' })),
      resetSemilla: () => set({ tiendas: seedTiendas, plan: null }),
      toast: (msg, tipo = 'ok') => {
        const id = ++toastId;
        set((s) => ({ toasts: [...s.toasts, { id, msg, tipo }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'rutas-visita-v1',
      // No persistimos toasts
      partialize: (s) => ({
        tiendas: s.tiendas,
        plan: s.plan,
        tema: s.tema,
        opciones: s.opciones,
        especial: s.especial,
        especialVisitadas: s.especialVisitadas,
      }),
    },
  ),
);
