// Resuelve enlaces cortos maps.app.goo.gl a coordenadas (lat/lng) y genera el
// seed de tiendas en src/data/tiendas.seed.json.
// Uso: node scripts/resolve_coords.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(__dirname, 'tiendas_raw.tsv'), 'utf8');

const rows = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((line) => {
    const [id, nombre, zona, url] = line.split('\t');
    return { id_tienda: `T${id}`, nombre: nombre.trim(), zona: zona.trim(), url_ubicacion: url.trim() };
  });

// Extrae coordenadas de una URL final de Google Maps.
// Prioriza el patrón !3d<lat>!4d<lng> (ubicación real del lugar),
// luego cae al centro del mapa @lat,lng.
function extractCoords(finalUrl) {
  let m = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

async function resolveOne(row, attempt = 1) {
  try {
    const res = await fetch(row.url_ubicacion, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const coords = extractCoords(res.url);
    return { ...row, ...(coords ?? { lat: null, lng: null }) };
  } catch (err) {
    if (attempt < 3) return resolveOne(row, attempt + 1);
    console.error(`  ! fallo ${row.id_tienda}: ${err.message}`);
    return { ...row, lat: null, lng: null };
  }
}

// Concurrencia limitada para no saturar la red
async function run() {
  const CONCURRENCY = 12;
  const out = [];
  let done = 0;
  const queue = [...rows];
  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      const r = await resolveOne(row);
      out.push(r);
      done++;
      if (done % 20 === 0 || done === rows.length) console.log(`  ${done}/${rows.length} resueltas`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  out.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const okCoords = out.filter((r) => r.lat != null).length;
  console.log(`\nCoordenadas obtenidas: ${okCoords}/${out.length}`);
  const zonas = [...new Set(out.map((r) => r.zona))].sort();
  console.log(`Zonas (${zonas.length}): ${zonas.join(' | ')}`);

  const dataDir = resolve(__dirname, '..', 'src', 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(resolve(dataDir, 'tiendas.seed.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(`\nSeed escrito en src/data/tiendas.seed.json`);
}

run();
