import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Tienda } from '../types';

interface Props {
  tiendas: Tienda[]; // en orden de ruta
  visitadas: Set<string>;
  tema: 'claro' | 'oscuro';
}

// Icono de marcador: círculo numerado (verde con ✓ si está visitada).
function iconoParada(numero: number, visitada: boolean): L.DivIcon {
  const bg = visitada ? '#10b981' : '#2563eb';
  const contenido = visitada ? '✓' : String(numero);
  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${bg};color:#fff;font-weight:700;font-size:13px;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "><span style="transform:rotate(45deg)">${contenido}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -28],
  });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

export default function MapaDia({ tiendas, visitadas, tema }: Props) {
  const contRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const capaRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  // Inicializa el mapa una sola vez
  useEffect(() => {
    if (!contRef.current || mapRef.current) return;
    const map = L.map(contRef.current, { zoomControl: true, attributionControl: true }).setView(
      [6.24, -75.58],
      11,
    );
    mapRef.current = map;
    capaRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      capaRef.current = null;
      tileRef.current = null;
    };
  }, []);

  // Capa de tiles según tema (claro / oscuro)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileRef.current?.remove();
    const url =
      tema === 'oscuro'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
  }, [tema]);

  // Marcadores + línea de ruta; reajusta encuadre
  useEffect(() => {
    const map = mapRef.current;
    const capa = capaRef.current;
    if (!map || !capa) return;
    capa.clearLayers();

    const pts = tiendas.filter((t) => t.lat != null && t.lng != null);
    if (pts.length === 0) return;

    const latlngs = pts.map((t) => [t.lat as number, t.lng as number] as [number, number]);

    // Línea que conecta las paradas en orden
    if (latlngs.length >= 2) {
      L.polyline(latlngs, { color: '#2563eb', weight: 3, opacity: 0.65, dashArray: '6,7' }).addTo(capa);
    }

    // Marcadores numerados (según el orden real en la lista `tiendas`)
    let n = 0;
    tiendas.forEach((t) => {
      if (t.lat == null || t.lng == null) return;
      n++;
      const vis = visitadas.has(t.id_tienda);
      L.marker([t.lat, t.lng], { icon: iconoParada(n, vis) })
        .addTo(capa)
        .bindPopup(`<b>#${n} · ${escapeHtml(t.nombre)}</b><br><span style="color:#64748b">${escapeHtml(t.zona)}</span>`);
    });

    map.fitBounds(L.latLngBounds(latlngs).pad(0.25));
    // El contenedor puede haberse mostrado tras un toggle → recalcular tamaño
    setTimeout(() => map.invalidateSize(), 60);
  }, [tiendas, visitadas]);

  return (
    <div
      ref={contRef}
      className="h-72 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
    />
  );
}
