import type { Tienda } from '../types';

export interface Punto {
  lat: number;
  lng: number;
}

// Distancia en kilómetros entre dos coordenadas (fórmula de haversine).
export function haversineKm(a: Punto, b: Punto): number {
  const R = 6371; // radio terrestre km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function tieneCoords(t: Tienda): t is Tienda & { lat: number; lng: number } {
  return t.lat != null && t.lng != null;
}

// Centroide (promedio) de un conjunto de tiendas con coordenadas.
export function centroide(tiendas: Tienda[]): Punto | null {
  const con = tiendas.filter(tieneCoords);
  if (con.length === 0) return null;
  const lat = con.reduce((s, t) => s + t.lat, 0) / con.length;
  const lng = con.reduce((s, t) => s + t.lng, 0) / con.length;
  return { lat, lng };
}

// Longitud total de un recorrido (suma de tramos consecutivos), en km.
export function longitudRuta(tiendas: Tienda[]): number {
  let total = 0;
  for (let i = 0; i < tiendas.length - 1; i++) {
    const a = tiendas[i];
    const b = tiendas[i + 1];
    if (tieneCoords(a) && tieneCoords(b)) total += haversineKm(a, b);
  }
  return total;
}
