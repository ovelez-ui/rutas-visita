import { createClient } from '@supabase/supabase-js';

// Datos públicos por diseño (la publishable key va en el cliente; la seguridad
// se maneja con las reglas RLS del lado del servidor).
export const SUPABASE_URL = 'https://pcnkcuekaemulvigsigs.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_9ynpdQtJHmcfqkZoeyDL8g_RU78xx16';

export const BUCKET_FOTOS = 'fotos-visitas';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
