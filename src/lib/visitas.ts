import { get, set, del } from 'idb-keyval';

// Registro de visita por punto (foto(s) + observaciones), guardado en IndexedDB.
// Diseño local-first: funciona offline; en la Parte 2 se sincroniza a la nube.

export interface Foto {
  id: string;
  dataUrl: string; // JPEG comprimido en base64
  fecha: string; // ISO
}

export interface Visita {
  observaciones: string;
  fotos: Foto[];
  actualizado: string; // ISO
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
