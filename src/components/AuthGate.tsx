import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { IconMail, IconRutas } from './icons';

// Muro de acceso: sin sesión muestra el login (magic link); con sesión, la app.
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (cargando) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-slate-50 text-sm text-slate-400">
        Cargando…
      </div>
    );
  }

  if (session) return <>{children}</>;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const correo = email.trim();
    if (!correo) return;
    setEstado('enviando');
    setMsg('');
    const redirect = window.location.href.split('#')[0];
    const { error } = await supabase.auth.signInWithOtp({
      email: correo,
      options: { shouldCreateUser: false, emailRedirectTo: redirect },
    });
    if (error) {
      setEstado('error');
      // Con shouldCreateUser:false, un correo no autorizado da error de "signups".
      const noAutorizado = /signup|not allowed|not found|no user/i.test(error.message);
      setMsg(noAutorizado ? 'Este correo no está autorizado para ingresar.' : error.message);
    } else {
      setEstado('enviado');
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <IconRutas className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">Rutas de Visita</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresa con tu correo para continuar</p>
        </div>

        {estado === 'enviado' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-2xl">📬</div>
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Te enviamos un enlace de acceso a<br />
              <b>{email.trim()}</b>
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Ábrelo <b>en este mismo dispositivo</b> para entrar. Revisa también la carpeta de spam.
            </p>
            <button
              onClick={() => setEstado('idle')}
              className="mt-3 text-xs font-medium text-emerald-700 underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinadora@empresa.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {estado === 'error' && <p className="mt-2 text-xs text-rose-600">{msg}</p>}
            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <IconMail className="h-4 w-4" />
              {estado === 'enviando' ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Recibirás un enlace para entrar sin contraseña.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
