import { supabase, BUCKET_FOTOS } from './supabase';
import { comprimirImagen, dataUrlABlob, type Foto } from './visitas';

export type { Foto };
export { comprimirImagen };

export interface Viatico {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  monto: number;
  categoria: string;
  fotos?: Foto[]; // facturas
  creado?: string;
}

// Sube la foto de una factura al bucket (carpeta facturas/) y devuelve sus datos.
export async function subirFactura(dataUrl: string): Promise<Foto> {
  const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const path = `facturas/${id}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, dataUrlABlob(dataUrl), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path);
  return { id, dataUrl, path, url: data.publicUrl, fecha: new Date().toISOString() };
}

// Actualiza las facturas de un viático existente.
export async function actualizarFotosViatico(id: string, fotos: Foto[]): Promise<void> {
  const meta = fotos.map((f) => ({ id: f.id, path: f.path, url: f.url, fecha: f.fecha }));
  const { error } = await supabase.from('viaticos').update({ fotos: meta }).eq('id', id);
  if (error) throw error;
}

export const CATEGORIAS = ['Transporte', 'Alimentación', 'Peajes', 'Parqueadero', 'Hospedaje', 'Otros'];

export async function listarViaticos(): Promise<Viatico[]> {
  const { data, error } = await supabase
    .from('viaticos')
    .select('*')
    .order('fecha', { ascending: false })
    .order('creado', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Viatico[];
}

export async function agregarViatico(v: Omit<Viatico, 'id' | 'creado'>): Promise<Viatico> {
  // Guardamos solo metadatos de foto (no el dataUrl) para no inflar la base.
  const fila = {
    ...v,
    fotos: (v.fotos ?? []).map((f) => ({ id: f.id, path: f.path, url: f.url, fecha: f.fecha })),
  };
  const { data, error } = await supabase.from('viaticos').insert(fila).select().single();
  if (error) throw error;
  return data as Viatico;
}

export async function eliminarViatico(id: string): Promise<void> {
  const { error } = await supabase.from('viaticos').delete().eq('id', id);
  if (error) throw error;
}

// Formato en pesos colombianos, sin decimales.
export function formatoCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Fecha local de hoy en formato YYYY-MM-DD.
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA');
}
