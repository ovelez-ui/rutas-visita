import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
// Dos modos de build:
//   • normal (production)  → PWA instalable, salida en dist/
//   • --mode singlefile    → un único HTML autocontenido en dist-html/
export default defineConfig(({ mode }) => {
  const unSoloArchivo = mode === 'singlefile';

  return {
    base: './', // rutas relativas: funciona en subcarpetas, hosting estático y archivo local
    plugins: [
      react(),
      ...(unSoloArchivo
        ? [viteSingleFile()]
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['app-icon.svg', 'apple-touch-icon.png', 'favicon-64.png'],
              manifest: {
                name: 'Rutas de Visita',
                short_name: 'Rutas',
                description: 'Planeador de rutas de visita a tiendas',
                theme_color: '#2563eb',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                lang: 'es',
                start_url: './',
                scope: './',
                icons: [
                  { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                  { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                navigateFallback: 'index.html',
              },
            }),
          ]),
    ],
    build: {
      outDir: unSoloArchivo ? 'dist-html' : 'dist',
    },
  };
});
