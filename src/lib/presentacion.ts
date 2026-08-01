import { supabase } from './supabase';

export interface Slide {
  id_tienda: string;
  nombre: string;
  zona: string;
  foto_url: string | null;
  texto: string;
}

export interface Presentacion {
  fecha: string;
  total: number;
  slides: Slide[];
}

// Llama a la Edge Function que genera las láminas con Gemini (visión).
export async function generarPresentacion(
  fecha: string,
  tiendas: { id: string; nombre: string; zona: string }[],
): Promise<Presentacion> {
  const { data, error } = await supabase.functions.invoke('presentacion', {
    body: { fecha, tiendas },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as Presentacion;
}
