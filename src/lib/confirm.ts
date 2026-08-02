import { create } from 'zustand';

export interface ConfirmOpts {
  titulo: string;
  mensaje?: string;
  textoOk?: string;
  peligro?: boolean;
}

interface ConfirmState {
  opts: ConfirmOpts | null;
  resolver: ((v: boolean) => void) | null;
}

const store = create<ConfirmState>(() => ({ opts: null, resolver: null }));

// Muestra un diálogo de confirmación con el estilo de la app y resuelve
// a true/false según la respuesta del usuario.
export function confirmar(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => store.setState({ opts, resolver: resolve }));
}

export function responderConfirm(v: boolean) {
  const { resolver } = store.getState();
  resolver?.(v);
  store.setState({ opts: null, resolver: null });
}

export const useConfirm = store;
