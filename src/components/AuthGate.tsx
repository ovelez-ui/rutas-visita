import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { IconMail } from './icons';

// Muro de acceso: sin sesión muestra el login (código por correo); con sesión, la app.
export function AuthGate({ children }: { children: ReactNode }) {
  // En desarrollo local (npm run dev) se omite el login para poder probar.
  // La build de producción SIEMPRE exige inicio de sesión.
  if (import.meta.env.DEV) return <>{children}</>;

  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

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
      <div className="grid min-h-[100dvh] place-items-center bg-slate-50 text-sm text-slate-400">Cargando…</div>
    );
  }
  if (session) return <>{children}</>;

  // Paso 1: enviar el código al correo
  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const correo = email.trim();
    if (!correo) return;
    setOcupado(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: correo,
      options: { shouldCreateUser: false },
    });
    setOcupado(false);
    if (error) {
      const noAutorizado = /signup|not allowed|not found|no user/i.test(error.message);
      setError(noAutorizado ? 'Este correo no está autorizado para ingresar.' : error.message);
    } else {
      setPaso('codigo');
    }
  };

  // Paso 2: verificar el código de 6 dígitos
  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = codigo.replace(/\D/g, '');
    if (token.length < 6) {
      setError('Escribe el código de 6 dígitos.');
      return;
    }
    setOcupado(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
    setOcupado(false);
    if (error) {
      setError('Código incorrecto o vencido. Revisa e intenta de nuevo.');
    }
    // si es correcto, onAuthStateChange muestra la app
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="./logo-pasteur.png" alt="Pasteur" className="h-10 w-auto" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Rutas de Visita</h1>
          <p className="mt-1 text-sm text-slate-500">
            {paso === 'correo' ? 'Ingresa con tu correo para continuar' : 'Escribe el código que te llegó'}
          </p>
        </div>

        {paso === 'correo' ? (
          <form onSubmit={enviarCodigo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@pasteur.com.co"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={ocupado}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <IconMail className="h-4 w-4" />
              {ocupado ? 'Enviando…' : 'Enviar código'}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Te llegará un código de 6 dígitos por correo.
            </p>
          </form>
        ) : (
          <form onSubmit={verificarCodigo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-center text-sm text-slate-600">
              Enviamos un código a<br />
              <b>{email.trim()}</b>
            </p>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Código de 6 dígitos</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-center text-lg font-semibold tracking-[0.4em] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={ocupado}
              className="mt-3 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {ocupado ? 'Verificando…' : 'Entrar'}
            </button>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <button type="button" onClick={() => { setPaso('correo'); setCodigo(''); setError(''); }} className="font-medium text-slate-500 underline">
                Cambiar correo
              </button>
              <button type="button" onClick={(ev) => enviarCodigo(ev as unknown as React.FormEvent)} className="font-medium text-brand-600 underline">
                Reenviar código
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Revisa también la carpeta de spam. El código sirve por unos minutos.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
