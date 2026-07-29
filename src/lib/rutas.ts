import type { DiaRuta, PlanRutas, Tienda } from '../types';
import { centroide, haversineKm, longitudRuta, tieneCoords, type Punto } from './geo';

export interface OpcionesRuta {
  min: number; // paradas mínimas objetivo por día (5)
  max: number; // paradas máximas por día (6)
  radioMezclaKm: number; // distancia máx. entre centroides para combinar zonas cortas
}

export const OPCIONES_DEFECTO: OpcionesRuta = { min: 5, max: 6, radioMezclaKm: 10 };

// ── 1. Ordenamiento por proximidad ─────────────────────────────────────────
// Nearest-neighbor: parte del punto dado (o el más al noroeste) y en cada paso
// va a la tienda más cercana no visitada.
function nearestNeighbor(tiendas: Tienda[], inicio?: Punto): Tienda[] {
  const con = tiendas.filter(tieneCoords);
  const sin = tiendas.filter((t) => !tieneCoords(t)); // sin coords: se anexan al final
  if (con.length <= 2) return [...con, ...sin];

  const restantes = [...con];
  const ruta: (Tienda & { lat: number; lng: number })[] = [];

  // Punto de partida: el indicado, o el más al noroeste (menor lat+lng) para determinismo
  let idx = 0;
  if (inicio) {
    idx = restantes.reduce(
      (best, t, i) =>
        haversineKm(t, inicio) < haversineKm(restantes[best], inicio) ? i : best,
      0,
    );
  } else {
    idx = restantes.reduce((best, t, i) => (t.lat + t.lng < restantes[best].lat + restantes[best].lng ? i : best), 0);
  }

  let actual = restantes.splice(idx, 1)[0];
  ruta.push(actual);
  while (restantes.length) {
    let mejor = 0;
    let mejorD = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const d = haversineKm(actual, restantes[i]);
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    }
    actual = restantes.splice(mejor, 1)[0];
    ruta.push(actual);
  }
  return [...ruta, ...sin];
}

// 2-opt: mejora local que deshace cruces invirtiendo segmentos del recorrido.
function dosOpt(ruta: Tienda[], maxPasadas = 30): Tienda[] {
  const con = ruta.filter(tieneCoords) as (Tienda & { lat: number; lng: number })[];
  const sin = ruta.filter((t) => !tieneCoords(t));
  if (con.length < 4) return [...con, ...sin];

  let mejor = con.slice();
  let mejora = true;
  let pasadas = 0;
  while (mejora && pasadas < maxPasadas) {
    mejora = false;
    pasadas++;
    for (let i = 0; i < mejor.length - 1; i++) {
      for (let k = i + 1; k < mejor.length; k++) {
        // Ganancia de invertir el segmento [i..k]
        const a = mejor[i - 1];
        const b = mejor[i];
        const c = mejor[k];
        const d = mejor[k + 1];
        const antes =
          (a ? haversineKm(a, b) : 0) + (d ? haversineKm(c, d) : 0);
        const despues =
          (a ? haversineKm(a, c) : 0) + (d ? haversineKm(b, d) : 0);
        if (despues + 1e-9 < antes) {
          const seg = mejor.slice(i, k + 1).reverse();
          mejor = [...mejor.slice(0, i), ...seg, ...mejor.slice(k + 1)];
          mejora = true;
        }
      }
    }
  }
  return [...mejor, ...sin];
}

// Ordena una zona completa por proximidad (NN + 2-opt).
export function ordenarPorProximidad(tiendas: Tienda[], inicio?: Punto): Tienda[] {
  return dosOpt(nearestNeighbor(tiendas, inicio));
}

// ── 2. División en días priorizando el objetivo 5–6 ──────────────────────────
// Reparte una lista ya ordenada en trozos, cada uno ≤ max, buscando que el mayor
// número posible de días quede dentro de [min, max].
//   • Si con el mínimo número de días (k = ⌈n/max⌉) TODOS pueden quedar en
//     [min, max], se reparte equilibrado (ej. 10 → 5,5 · 11 → 6,5 · 12 → 6,6).
//   • Si no es posible (ej. 7, 8, 9, 13…), se llenan días completos de `max` y se
//     aísla un residuo pequeño (ej. 7 → 6,1 · 8 → 6,2 · 13 → 6,6,1). Ese residuo
//     pequeño luego puede combinarse con el de otra zona cercana.
function dividirPorObjetivo(ordenadas: Tienda[], min: number, max: number): Tienda[][] {
  const n = ordenadas.length;
  if (n === 0) return [];
  const k = Math.ceil(n / max); // días mínimos con tope max
  const trozos: Tienda[][] = [];

  if (k * min <= n) {
    // Factible que todos queden en [min, max] → reparto equilibrado
    const base = Math.floor(n / k);
    const resto = n - base * k;
    let pos = 0;
    for (let d = 0; d < k; d++) {
      const tam = base + (d < resto ? 1 : 0);
      trozos.push(ordenadas.slice(pos, pos + tam));
      pos += tam;
    }
  } else {
    // No factible → (k-1) días llenos + 1 residuo pequeño aislado
    let pos = 0;
    for (let d = 0; d < k - 1; d++) {
      trozos.push(ordenadas.slice(pos, pos + max));
      pos += max;
    }
    trozos.push(ordenadas.slice(pos)); // residuo (1..max-1)
  }
  return trozos;
}

// ── 3. Ordenar las zonas geográficamente (para que los días progresen) ───────
function ordenarZonasPorCentroide(zonas: string[], porZona: Map<string, Tienda[]>): string[] {
  const centros = new Map<string, Punto | null>();
  zonas.forEach((z) => centros.set(z, centroide(porZona.get(z)!)));

  const conCentro = zonas.filter((z) => centros.get(z));
  const sinCentro = zonas.filter((z) => !centros.get(z));
  if (conCentro.length <= 1) return [...conCentro, ...sinCentro];

  // Nearest-neighbor sobre los centroides de zona, empezando por la más al norte.
  const restantes = [...conCentro];
  let idx = restantes.reduce((b, z, i) => (centros.get(z)!.lat > centros.get(restantes[b])!.lat ? i : b), 0);
  const orden: string[] = [];
  let actual = restantes.splice(idx, 1)[0];
  orden.push(actual);
  while (restantes.length) {
    const ca = centros.get(actual)!;
    let mejor = 0;
    let mejorD = Infinity;
    restantes.forEach((z, i) => {
      const d = haversineKm(ca, centros.get(z)!);
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    });
    actual = restantes.splice(mejor, 1)[0];
    orden.push(actual);
  }
  return [...orden, ...sinCentro];
}

// ── 4. Combinar días cortos (< min) de zonas cercanas ────────────────────────
interface Bloque {
  zonas: string[];
  tiendas: Tienda[];
}

function combinarCortos(bloques: Bloque[], opts: OpcionesRuta): Bloque[] {
  const normales = bloques.filter((b) => b.tiendas.length >= opts.min);
  // Residuos cortos, del más pequeño al más grande (los diminutos se colocan primero)
  const pool = bloques
    .filter((b) => b.tiendas.length < opts.min)
    .sort((a, b) => a.tiendas.length - b.tiendas.length);

  while (pool.length) {
    const bin = pool.shift()!; // semilla del nuevo día
    // Crecemos el día agregando el residuo más cercano compatible, hasta llenar.
    let creció = true;
    while (creció && bin.tiendas.length < opts.max) {
      creció = false;
      const cbin = centroide(bin.tiendas);
      let mejor = -1;
      let mejorD = Infinity;
      for (let j = 0; j < pool.length; j++) {
        if (bin.tiendas.length + pool[j].tiendas.length > opts.max) continue;
        const cj = centroide(pool[j].tiendas);
        const d = cbin && cj ? haversineKm(cbin, cj) : Infinity;
        if (d < mejorD) {
          mejorD = d;
          mejor = j;
        }
      }
      if (mejor >= 0 && mejorD <= opts.radioMezclaKm) {
        const otro = pool.splice(mejor, 1)[0];
        bin.tiendas = ordenarPorProximidad([...bin.tiendas, ...otro.tiendas]);
        bin.zonas = [...new Set([...bin.zonas, ...otro.zonas])];
        creció = true;
      }
    }
    normales.push(bin);
  }
  return normales;
}

// ── 5. Generación del plan completo ──────────────────────────────────────────
export function generarPlan(tiendas: Tienda[], opts: OpcionesRuta = OPCIONES_DEFECTO): PlanRutas {
  // Agrupar por zona
  const porZona = new Map<string, Tienda[]>();
  for (const t of tiendas) {
    if (!porZona.has(t.zona)) porZona.set(t.zona, []);
    porZona.get(t.zona)!.push(t);
  }
  const zonas = ordenarZonasPorCentroide([...porZona.keys()], porZona);

  // Por cada zona: ordenar por proximidad y dividir en bloques de día
  let bloques: Bloque[] = [];
  for (const zona of zonas) {
    const ordenadas = ordenarPorProximidad(porZona.get(zona)!);
    for (const trozo of dividirPorObjetivo(ordenadas, opts.min, opts.max)) {
      bloques.push({ zonas: [zona], tiendas: trozo });
    }
  }

  // Combinar días cortos de zonas cercanas (solo si ayuda)
  bloques = combinarCortos(bloques, opts);

  // Reordenar los bloques resultantes siguiendo el orden geográfico de zonas
  bloques.sort((a, b) => zonas.indexOf(a.zonas[0]) - zonas.indexOf(b.zonas[0]));

  // Materializar días
  const dias: DiaRuta[] = bloques.map((b, i) => ({
    dia: i + 1,
    zonas: b.zonas,
    paradas: b.tiendas.map((t, j) => ({ id_tienda: t.id_tienda, orden: j + 1, visitada: false })),
  }));

  return {
    generadoEn: new Date().toISOString(),
    dias,
    objetivoMin: opts.min,
    objetivoMax: opts.max,
  };
}

// Utilidad para la UI: km estimados de un día (necesita las tiendas completas).
export function kmDia(dia: DiaRuta, mapaTiendas: Map<string, Tienda>): number {
  const orden = dia.paradas
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((p) => mapaTiendas.get(p.id_tienda))
    .filter((t): t is Tienda => !!t);
  return longitudRuta(orden);
}
