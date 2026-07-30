import type { Tienda } from '../types';
import type { Foto, VisitaFila } from './visitas';

// Genera correos con mailto: se abre la app de correo del propio usuario
// (remitente = su cuenta) y él elige el destinatario. Las fotos van como
// enlaces a la nube (mailto no permite adjuntar archivos).

function lineasFotos(fotos: Foto[] | undefined, indent = ''): string {
  if (!fotos || fotos.length === 0) return `${indent}(sin fotos)`;
  return fotos
    .map((f, i) => `${indent}${i + 1}. ${f.url ?? '(foto pendiente de subir a la nube)'}`)
    .join('\n');
}

export function correoIndividual(
  idTienda: string,
  tienda: { nombre?: string; zona?: string } | undefined,
  v: { observaciones: string; fotos: Foto[]; actualizado?: string },
): { subject: string; body: string } {
  const nombre = tienda?.nombre ?? idTienda;
  const subject = `Visita: ${nombre} (${idTienda})`;
  const body = [
    `Tienda: ${nombre} (${idTienda})`,
    tienda?.zona ? `Zona: ${tienda.zona}` : null,
    v.actualizado ? `Fecha: ${new Date(v.actualizado).toLocaleString('es-CO')}` : null,
    '',
    'Observaciones:',
    v.observaciones?.trim() || '(sin observaciones)',
    '',
    `Fotos (${v.fotos?.length ?? 0}):`,
    lineasFotos(v.fotos),
  ]
    .filter((l) => l !== null)
    .join('\n');
  return { subject, body };
}

export function correoReporte(
  filas: VisitaFila[],
  mapa: Map<string, Tienda>,
): { subject: string; body: string } {
  const ahora = new Date();
  const subject = `Reporte de visitas — ${ahora.toLocaleDateString('es-CO')}`;
  const totalFotos = filas.reduce((s, f) => s + (f.fotos?.length ?? 0), 0);

  const secciones = filas
    .map((f, i) => {
      const t = mapa.get(f.id_tienda);
      const nombre = t?.nombre ?? f.id_tienda;
      return [
        `${i + 1}. ${nombre} (${f.id_tienda})${t?.zona ? ' — ' + t.zona : ''}`,
        `   Obs: ${f.observaciones?.trim() || '(sin observaciones)'}`,
        `   Fotos:`,
        lineasFotos(f.fotos, '     '),
      ].join('\n');
    })
    .join('\n\n');

  const body = [
    'REPORTE DE VISITAS — CONSOLIDADO',
    `Generado: ${ahora.toLocaleString('es-CO')}`,
    `Puntos: ${filas.length} · Fotos: ${totalFotos}`,
    '',
    '────────────────────',
    '',
    secciones,
  ].join('\n');
  return { subject, body };
}

// Abre la app de correo del usuario con el asunto y cuerpo prellenados.
export function abrirCorreo(subject: string, body: string) {
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
