// Supabase Edge Function: genera las láminas de la presentación de un día.
// La IA (Gemini, visión) redacta cada lámina basándose en las OBSERVACIONES
// del asesor; la foto es solo apoyo visual. La API key vive aquí como secreto.
//
// Secreto requerido: GEMINI_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = 'gemini-flash-latest';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Instrucción por defecto (la app puede enviar la suya en `instruccion`).
const INSTRUCCION_DEFECTO =
  'Eres asesor(a) dermocosmético(a) profesional. Con base en las OBSERVACIONES del asesor ' +
  '(que son lo más importante), redacta un comentario profesional y breve (2 a 3 frases) para ' +
  'una lámina de presentación. Usa la foto solo como apoyo visual para reforzar lo que dicen las ' +
  'observaciones; NO describas literalmente el contenido de la foto. Responde solo el comentario, ' +
  'en español, sin encabezados.';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

async function comentar(instruccion: string, nombre: string, zona: string, obs: string, fotoUrl?: string): Promise<string> {
  const prompt =
    `${instruccion}\n\n` +
    `Tienda: "${nombre}" (zona ${zona || '—'}).\n` +
    `Observaciones del asesor: "${obs || 'sin observaciones'}".`;

  const parts: unknown[] = [{ text: prompt }];
  if (fotoUrl) {
    try {
      const r = await fetch(fotoUrl);
      const bytes = new Uint8Array(await r.arrayBuffer());
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: toBase64(bytes) } });
    } catch { /* sigue solo con texto */ }
  }

  if (!GEMINI_KEY) return 'IA: falta el secreto GEMINI_API_KEY';
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) },
  );
  const data = await resp.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (txt) return txt;
  return 'IA: ' + (data?.error?.message || JSON.stringify(data).slice(0, 180));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });

    const { fecha, tiendas, instruccion } = await req.json();
    if (!fecha) return new Response(JSON.stringify({ error: 'Falta la fecha' }), { status: 400, headers: cors });
    const guia = (instruccion && String(instruccion).trim()) || INSTRUCCION_DEFECTO;

    const info = new Map((tiendas ?? []).map((t: any) => [t.id, { nombre: t.nombre, zona: t.zona }]));
    const { data: visitas, error } = await supabase.from('visitas').select('*');
    if (error) throw error;

    const delDia = (visitas ?? []).filter((v: any) =>
      (v.actualizado ?? '').startsWith(fecha) && ((v.fotos?.length ?? 0) > 0 || (v.observaciones ?? '').trim()));

    const slides = [];
    for (const v of delDia) {
      const t = info.get(v.id_tienda) ?? { nombre: v.id_tienda, zona: '' };
      const fotoUrl = v.fotos?.[0]?.url;
      const texto = await comentar(guia, t.nombre, t.zona, v.observaciones ?? '', fotoUrl);
      slides.push({ id_tienda: v.id_tienda, nombre: t.nombre, zona: t.zona, foto_url: fotoUrl ?? null, texto });
    }

    return new Response(JSON.stringify({ fecha, total: slides.length, slides }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
