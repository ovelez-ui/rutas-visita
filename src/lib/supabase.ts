import { createClient } from '@supabase/supabase-js';

// Datos públicos por diseño (la publishable key va en el cliente; la seguridad
// se maneja con las reglas RLS del lado del servidor).
export const SUPABASE_URL = 'https://pcnkcuekaemulvigsigs.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_9ynpdQtJHmcfqkZoeyDL8g_RU78xx16';

export const BUCKET_FOTOS = 'fotos-visitas';

// Interruptor global de acceso. TEMPORAL en false mientras el login está
// desactivado. Para reactivar el ingreso: cambiar a true y desplegar.
export const REQUERIR_LOGIN = false;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // el enlace vuelve con ?code=… (no choca con el HashRouter)
  },
});

// En modo sin login, descarta cualquier sesión previa guardada en el dispositivo
// (de intentos de login anteriores). Así el cliente usa siempre la clave anónima
// limpia y no manda un token caducado que la nube rechazaría al guardar.
if (!REQUERIR_LOGIN) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) supabase.auth.signOut({ scope: 'local' });
  });
}
