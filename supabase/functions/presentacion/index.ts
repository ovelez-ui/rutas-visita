// Supabase Edge Function: genera las láminas de la presentación de un día.
// Analiza cada foto de visita con Google Gemini (visión) + las observaciones.
// La API key de Gemini vive aquí como secreto (nunca en el navegador).
//
// Secreto requerido: GEMINI_API_KEY
// (SUPABASE_URL y SUPABASE_ANON_KEY los inyecta Supabase automáticamente.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = 'gemini-2.0-flash'; // modelo gratuito con visión; cambiable si hace falta
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Base64 por bloques (evita desbordar la pila con imágenes grandes).
function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function comentarConGemini(nombre: string, zona: string, obs: string, fotoUrl?: string): Promise<string> {
  const prompt =
    `Eres asesor(a) dermocosmético(a) profesional. Redacta un comentario breve (2 a 3 frases), ` +
    `claro y positivo, para una lámina de presentación sobre esta visita.\n` +
    `Tienda: "${nombre}" (zona ${zona || '—'}).\n` +
    `Observaciones del asesor: "${obs || 'sin observaciones'}".\n` +
    (fotoUrl ? `Analiza también la foto (exhibición, orden, surtido, oportunidades de mejora).\n` : '') +
    `Responde solo el comentario, en español, sin encabezados.`;

  const parts: unknown[] = [{ text: prompt }];
  if (fotoUrl) {
    try {
      const r = await fetch(fotoUrl);
      const bytes = new Uint8Array(await r.arrayBuffer());
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: toBase64(bytes) } });
    } catch {
      // si la foto no carga, seguimos solo con el texto
    }
  }

  if (!GEMINI_KEY) return 'IA: falta el secreto GEMINI_API_KEY';
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) },
  );
  const data = await resp.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (txt) return txt;
  // Diagnóstico: mostrar el error real de Gemini
  return 'IA: ' + (data?.error?.message || JSON.stringify(data).slice(0, 180));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    // Cliente con el token del usuario → respeta RLS (solo autenticados leen visitas).
    const supabase = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });

    const { fecha, tiendas } = await req.json();
    if (!fecha) return new Response(JSON.stringify({ error: 'Falta la fecha' }), { status: 400, headers: cors });

    const info = new Map<string, { nombre: string; zona: string }>(
      (tiendas ?? []).map((t: { id: string; nombre: string; zona: string }) => [t.id, { nombre: t.nombre, zona: t.zona }]),
    );

    const { data: visitas, error } = await supabase.from('visitas').select('*');
    if (error) throw error;

    // Visitas registradas ese día (por `actualizado`) con foto u observación.
    const delDia = (visitas ?? []).filter(
      (v: { actualizado?: string; fotos?: unknown[]; observaciones?: string }) =>
        (v.actualizado ?? '').startsWith(fecha) &&
        (((v.fotos as unknown[])?.length ?? 0) > 0 || (v.observaciones ?? '').trim()),
    );

    const slides = [];
    for (const v of delDia) {
      const t = info.get(v.id_tienda) ?? { nombre: v.id_tienda, zona: '' };
      const fotoUrl = v.fotos?.[0]?.url as string | undefined;
      const texto = await comentarConGemini(t.nombre, t.zona, v.observaciones ?? '', fotoUrl);
      slides.push({ id_tienda: v.id_tienda, nombre: t.nombre, zona: t.zona, foto_url: fotoUrl ?? null, texto });
    }

    return new Response(JSON.stringify({ fecha, total: slides.length, slides }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
