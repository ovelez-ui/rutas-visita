import { get, set, del } from 'idb-keyval';
import { supabase, BUCKET_FOTOS } from './supabase';

// Registro de visita por punto (foto(s) + observaciones).
// Diseño local-first: se guarda en IndexedDB (offline) y se sincroniza a Supabase.

export interface Foto {
  id: string;
  dataUrl: string; // JPEG comprimido en base64 (cache local para ver offline)
  fecha: string; // ISO
  path?: string; // ruta en el bucket de Supabase (una vez subida)
  url?: string; // URL pública de la foto en la nube
}

export interface Visita {
  observaciones: string;
  fotos: Foto[];
  actualizado: string; // ISO
  sincronizado?: string; // ISO del último push exitoso a la nube
}

export interface ResumenVisita {
  fotos: number;
  obs: boolean;
}

const VACIA: Visita = { observaciones: '', fotos: [], actualizado: '' };
const clave = (idTienda: string) => `visita:${idTienda}`;

export async function getVisita(idTienda: string): Promise<Visita> {
  return (await get<Visita>(clave(idTienda))) ?? { ...VACIA };
}

export async function saveVisita(idTienda: string, v: Visita): Promise<void> {
  await set(clave(idTienda), v);
}

export async function delVisita(idTienda: string): Promise<void> {
  await del(clave(idTienda));
}

export function resumen(v: Visita): ResumenVisita {
  return { fotos: v.fotos.length, obs: v.observaciones.trim().length > 0 };
}

// ── Sincronización con la nube (Supabase) ───────────────────────────────────

function dataUrlABlob(dataUrl: string): Blob {
  const [cab, b64] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(cab)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Sube fotos pendientes + guarda la fila en la tabla `visitas`.
// Devuelve la visita actualizada (con las URLs de la nube) y si quedó sincronizada.
export async function sincronizarVisita(
  idTienda: string,
  visita: Visita,
): Promise<{ visita: Visita; ok: boolean }> {
  try {
    // 1) Subir fotos que aún no tienen URL en la nube
    const fotos: Foto[] = [];
    for (const f of visita.fotos) {
      if (f.url) {
        fotos.push(f);
        continue;
      }
      const path = `${idTienda}/${f.id}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET_FOTOS)
        .upload(path, dataUrlABlob(f.dataUrl), { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path);
      fotos.push({ ...f, path, url: data.publicUrl });
    }

    // 2) Guardar la fila (metadatos, sin el dataUrl para no inflar la base)
    const fotosMeta = fotos.map((f) => ({ id: f.id, path: f.path, url: f.url, fecha: f.fecha }));
    const { error: errRow } = await supabase.from('visitas').upsert({
      id_tienda: idTienda,
      observaciones: visita.observaciones,
      fotos: fotosMeta,
      actualizado: visita.actualizado,
    });
    if (errRow) throw errRow;

    const actualizada: Visita = { ...visita, fotos, sincronizado: new Date().toISOString() };
    await saveVisita(idTienda, actualizada); // persistir URLs en cache local
    return { visita: actualizada, ok: true };
  } catch {
    return { visita, ok: false }; // sin conexión o tabla no lista: queda pendiente
  }
}

// Comprime una imagen de la cámara a JPEG (máx. `max` px de lado) para que
// pese poco: rápido de guardar, mostrar y subir a la nube después.
export function comprimirImagen(file: File, max = 1280, calidad = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas no disponible'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
