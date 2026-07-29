# Rutas de Visita

Aplicación web (PWA) para planear rutas de visita a tiendas. Usuario único, mobile-first,
sin backend: todos los datos se guardan en el navegador (localStorage).

## Requisitos

- Node.js 20+ y npm.

## Uso en desarrollo

```bash
cd rutas-visita
npm install
npm run dev
```

Abre `http://localhost:5173`. La primera vez se cargan 233 tiendas de ejemplo.

## Compilar para producción

```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve dist/ en local para probar
```

La carpeta `dist/` es un sitio estático: se puede subir a cualquier hosting
(Netlify, Vercel, GitHub Pages, un servidor propio) o abrir tras servirla.

### Versión en un solo archivo HTML (para compartir fácil)

```bash
npm run build:html   # genera rutas-visita.html (un único archivo autocontenido)
```

Ese archivo lleva todo dentro (JS, CSS y datos). Se puede enviar por correo/chat,
subir a cualquier hosting o abrir con doble clic. Nota: en este modo no hay
service worker (sin instalación como app ni caché offline); para eso, usa el build
normal (`dist/`) servido por HTTPS.

## Instalar como app (PWA)

Al abrir la app en Chrome/Edge (escritorio) o en el navegador del móvil aparece la
opción **«Instalar app»** / «Añadir a pantalla de inicio». Una vez instalada:

- Funciona **offline** (los datos y la app quedan cacheados).
- Se abre como una app independiente, a pantalla completa.

## Funcionalidades

- **Tiendas**: crear, editar, eliminar, buscar/filtrar por zona, importar CSV/Excel
  (reconoce el formato de la hoja Pasteur) y exportar a CSV.
- **Rutas**: botón «Generar rutas» que agrupa por zona, ordena por proximidad
  (nearest-neighbor + 2-opt) y reparte en días de 5–6 paradas. Selector de día,
  tarjetas con «Ir» y «Visitada», barra de progreso, reordenar arrastrando,
  «Reoptimizar» y «Ver ruta completa del día» en Google Maps.
- **Ajustes**: mínimo/máximo de paradas por día, radio para combinar zonas cercanas,
  tema claro/oscuro y restaurar datos de ejemplo.

## Datos y coordenadas

Cada tienda tiene: `id_tienda`, `nombre`, `zona`, `url_ubicacion` y opcionalmente
`lat`/`lng`. Las coordenadas habilitan la optimización por proximidad.

Los enlaces cortos `maps.app.goo.gl` no se pueden expandir desde el navegador (CORS).
Para regenerar coordenadas desde los enlaces (fuera del navegador):

```bash
node scripts/resolve_coords.mjs   # actualiza src/data/tiendas.seed.json
```

## Stack

React + TypeScript + Vite + Tailwind CSS v4 · estado con zustand (persistido) ·
drag & drop con @dnd-kit · importación Excel con SheetJS (xlsx) · PWA con vite-plugin-pwa.

## Limitaciones conocidas

- La optimización de rutas es heurística (no garantiza el óptimo absoluto del TSP).
- Las distancias son en línea recta (haversine), no por vías reales.
- Días con pocas tiendas en zonas remotas pueden quedar por debajo del mínimo (se avisa).
