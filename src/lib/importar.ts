import type { Tienda } from '../types';
import { extraerCoords } from './tiendas';

// Alias de encabezados aceptados (minúsculas, sin acentos ni espacios extra).
// Permite importar tanto el formato estándar como la hoja original de Pasteur.
const ALIAS: Record<keyof Tienda, string[]> = {
  id_tienda: ['id_tienda', 'id', 'almid', 'codigo', 'código', 'idtienda'],
  nombre: ['nombre', 'nombre de almacen', 'nombre de almacén', 'almacen', 'tienda', 'nombretienda'],
  zona: ['zona', 'zona logistica ultima milla', 'zona logística última milla', 'zonalogistica', 'zona logistica'],
  url_ubicacion: ['url_ubicacion', 'url', 'enlace', 'link', 'ubicacion', 'ubicación', 'maps', 'urlubicacion'],
  lat: ['lat', 'latitud', 'latitude'],
  lng: ['lng', 'lon', 'long', 'longitud', 'longitude'],
};

function normalizar(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Construye un mapa: campo -> nombre real de columna en el archivo
function mapearColumnas(headers: string[]): Partial<Record<keyof Tienda, string>> {
  const norm = headers.map((h) => ({ real: h, n: normalizar(h) }));
  const mapa: Partial<Record<keyof Tienda, string>> = {};
  (Object.keys(ALIAS) as (keyof Tienda)[]).forEach((campo) => {
    const found = norm.find((h) => ALIAS[campo].includes(h.n));
    if (found) mapa[campo] = found.real;
  });
  return mapa;
}

export interface ResultadoImport {
  tiendas: Tienda[];
  errores: string[]; // problemas por fila
  columnasFaltantes: string[];
  totalFilas: number;
}

// Parsea un ArrayBuffer (xlsx/xls/csv) a filas de objetos.
// xlsx se carga de forma diferida (chunk aparte) solo al importar.
async function leerFilas(buffer: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(hoja, { defval: '', raw: false });
}

export async function importarArchivo(file: File): Promise<ResultadoImport> {
  const buffer = await file.arrayBuffer();
  const filas = await leerFilas(buffer);
  const errores: string[] = [];

  if (filas.length === 0) {
    return { tiendas: [], errores: ['El archivo está vacío o no tiene datos.'], columnasFaltantes: [], totalFilas: 0 };
  }

  const headers = Object.keys(filas[0]);
  const cols = mapearColumnas(headers);

  const obligatorias: (keyof Tienda)[] = ['id_tienda', 'nombre', 'zona', 'url_ubicacion'];
  const columnasFaltantes = obligatorias.filter((c) => !cols[c]);
  if (columnasFaltantes.length) {
    return { tiendas: [], errores: [], columnasFaltantes, totalFilas: filas.length };
  }

  const vistos = new Set<string>();
  const tiendas: Tienda[] = [];

  filas.forEach((fila, i) => {
    const nFila = i + 2; // +1 header, +1 base-1
    const get = (c: keyof Tienda) => (cols[c] ? String(fila[cols[c]!] ?? '').trim() : '');

    const idRaw = get('id_tienda');
    const nombre = get('nombre');
    const zona = get('zona');
    const url = get('url_ubicacion');

    if (!idRaw && !nombre && !zona && !url) return; // fila vacía, ignorar

    // Normaliza el ID: si es numérico puro, le antepone "T" (formato del catálogo)
    const id_tienda = /^\d+$/.test(idRaw) ? `T${idRaw}` : idRaw;

    const falta: string[] = [];
    if (!id_tienda) falta.push('ID');
    if (!nombre) falta.push('nombre');
    if (!zona) falta.push('zona');
    if (!url) falta.push('URL');
    if (falta.length) {
      errores.push(`Fila ${nFila}: falta ${falta.join(', ')}.`);
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      errores.push(`Fila ${nFila} (${nombre}): URL inválida.`);
      return;
    }
    if (vistos.has(id_tienda)) {
      errores.push(`Fila ${nFila}: ID duplicado "${id_tienda}" dentro del archivo (se omite).`);
      return;
    }
    vistos.add(id_tienda);

    // Coordenadas: columnas explícitas o extraídas de la URL
    let lat: number | null = null;
    let lng: number | null = null;
    const latRaw = get('lat');
    const lngRaw = get('lng');
    if (latRaw && lngRaw && !isNaN(+latRaw) && !isNaN(+lngRaw)) {
      lat = +latRaw;
      lng = +lngRaw;
    } else {
      const c = extraerCoords(url);
      if (c) {
        lat = c.lat;
        lng = c.lng;
      }
    }

    tiendas.push({ id_tienda, nombre, zona, url_ubicacion: url, lat, lng });
  });

  return { tiendas, errores, columnasFaltantes: [], totalFilas: filas.length };
}

// Exporta las tiendas actuales a un archivo CSV descargable.
export function exportarCSV(tiendas: Tienda[]) {
  const rows = [
    ['id_tienda', 'nombre', 'zona', 'url_ubicacion', 'lat', 'lng'],
    ...tiendas.map((t) => [t.id_tienda, t.nombre, t.zona, t.url_ubicacion, t.lat ?? '', t.lng ?? '']),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tiendas.csv';
  a.click();
  URL.revokeObjectURL(url);
}
