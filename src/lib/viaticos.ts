import { supabase } from './supabase';

export interface Viatico {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  monto: number;
  categoria: string;
  creado?: string;
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
  const { data, error } = await supabase.from('viaticos').insert(v).select().single();
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
