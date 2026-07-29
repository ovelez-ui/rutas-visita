import type { Tienda } from '../types';

export type Errores = Partial<Record<keyof Tienda, string>>;

// Valida un formulario de tienda. `idsExistentes` excluye el id propio al editar.
export function validarTienda(
  t: Partial<Tienda>,
  idsExistentes: string[],
): Errores {
  const e: Errores = {};

  const id = (t.id_tienda ?? '').trim();
  if (!id) e.id_tienda = 'El ID es obligatorio';
  else if (idsExistentes.includes(id)) e.id_tienda = 'Ya existe una tienda con este ID';

  if (!(t.nombre ?? '').trim()) e.nombre = 'El nombre es obligatorio';
  if (!(t.zona ?? '').trim()) e.zona = 'La zona es obligatoria';

  const url = (t.url_ubicacion ?? '').trim();
  if (!url) e.url_ubicacion = 'La URL de ubicación es obligatoria';
  else if (!/^https?:\/\/.+/i.test(url)) e.url_ubicacion = 'Debe ser una URL válida (http/https)';

  if (t.lat != null && (isNaN(t.lat) || t.lat < -90 || t.lat > 90))
    e.lat = 'Latitud inválida (-90 a 90)';
  if (t.lng != null && (isNaN(t.lng) || t.lng < -180 || t.lng > 180))
    e.lng = 'Longitud inválida (-180 a 180)';

  return e;
}

// Intenta extraer coordenadas de una URL de Google Maps ya expandida.
export function extraerCoords(url: string): { lat: number; lng: number } | null {
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}
