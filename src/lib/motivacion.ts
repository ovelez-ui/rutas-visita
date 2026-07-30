// Mensajes motivacionales para la Coordinadora Dermo.
// Se rotan por día para que cada ruta tenga uno distinto.
const MENSAJES = [
  'Cada tienda que visitas hoy brilla un poco más gracias a ti. ✨',
  'Tu asesoría transforma rutinas en resultados: la piel de tus clientes lo agradece. 💧',
  'Coordinar es cuidar. Tu liderazgo se nota en cada mostrador. 💜',
  'Un paso a la vez, una tienda a la vez: así se construye un gran día.',
  'Tu conocimiento dermo es el mejor activo de cada punto de venta. ¡A brillar!',
  'La constancia, como una buena rutina de piel, siempre da frutos. Sigue así. 🌿',
  'Hoy no solo visitas tiendas: inspiras equipos y elevas la experiencia del cliente.',
  'Detrás de cada recomendación tuya hay alguien que se siente mejor consigo mismo. 💫',
  'Tu energía es contagiosa; llévala a cada zona que recorras hoy.',
  'Los grandes resultados nacen de visitas bien hechas. Vas por excelente camino.',
  'Cuida, asesora, conecta: eres la diferencia en cada dermo. 💗',
  'Que tu ruta de hoy sea tan luminosa como la piel que ayudas a cuidar. ☀️',
  'Pequeños detalles, gran impacto: tu trabajo se nota en cada estante.',
  'Confía en tu proceso: cada visita te acerca a tus metas. 🌟',
];

// Devuelve un mensaje estable para un día dado (mismo día → mismo mensaje).
export function mensajeDelDia(dia: number): string {
  const i = ((dia - 1) % MENSAJES.length + MENSAJES.length) % MENSAJES.length;
  return MENSAJES[i];
}
