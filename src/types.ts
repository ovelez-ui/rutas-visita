// Modelo de datos de la aplicación de rutas de visita

export interface Tienda {
  id_tienda: string; // Identificador único, ej. "T001"
  nombre: string;
  zona: string; // Agrupación geográfica; base de la lógica de rutas
  url_ubicacion: string; // Enlace de Google Maps
  lat?: number | null; // Latitud (opcional; usada para optimización)
  lng?: number | null; // Longitud (opcional)
}

// Una parada dentro de la ruta de un día
export interface Parada {
  id_tienda: string;
  orden: number; // Posición en la ruta (1-based)
  visitada: boolean;
}

// La ruta de un día concreto
export interface DiaRuta {
  dia: number; // Día 1, Día 2, ...
  zonas: string[]; // Zonas incluidas ese día
  paradas: Parada[];
}

// Plan de rutas completo generado
export interface PlanRutas {
  generadoEn: string; // ISO timestamp
  dias: DiaRuta[];
  objetivoMin: number; // objetivo mínimo de paradas por día (5)
  objetivoMax: number; // objetivo máximo por día (6)
}
