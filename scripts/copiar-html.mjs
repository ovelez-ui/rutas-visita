// Copia el HTML autocontenido a la raíz del proyecto con un nombre para compartir.
import { copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const origen = resolve(__dirname, '..', 'dist-html', 'index.html');
const destino = resolve(__dirname, '..', 'rutas-visita.html');

copyFileSync(origen, destino);
const kb = (statSync(destino).size / 1024).toFixed(0);
console.log(`\n✅ Archivo listo para compartir: rutas-visita.html (${kb} KB)`);
console.log('   Ábrelo con doble clic o súbelo a cualquier hosting.');
