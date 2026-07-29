import type { Tienda } from '../types';
import { tieneCoords } from './geo';

// Construye un enlace de Google Maps con direcciones a través de todas las
// paradas del día en orden. Usa coordenadas cuando existen.
// Formato: https://www.google.com/maps/dir/lat,lng/lat,lng/...
export function urlRutaCompleta(tiendasOrdenadas: Tienda[]): string | null {
  const puntos = tiendasOrdenadas
    .filter(tieneCoords)
    .map((t) => `${t.lat},${t.lng}`);
  if (puntos.length < 2) return null;
  return `https://www.google.com/maps/dir/${puntos.join('/')}`;
}
