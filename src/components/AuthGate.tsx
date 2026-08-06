import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Muro de acceso: sin sesión muestra el login (correo + contraseña); con sesión, la app.
export function AuthGate({ children }: { children: ReactNode }) {
  // En desarrollo local (npm run dev) se omite el login para poder probar.
  // La build de producción SIEMPRE exige inicio de sesión.
  if (import.meta.env.DEV) return <>{children}</>;

  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const correo = email.trim();
    if (!correo || !password) return;
    setOcupado(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
    setOcupado(false);
    if (error) {
      setError('Correo o contraseña incorrectos.');
    }
    // si es correcto, onAuthStateChange muestra la app
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="./logo-pasteur.png" alt="Pasteur" className="h-10 w-auto" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Rutas de Visita</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresa para continuar</p>
        </div>

        <form onSubmit={entrar} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <label className="mb-1.5 mt-3 block text-xs font-semibold text-slate-600">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={ocupado}
            className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {ocupado ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Tu sesión queda guardada; solo ingresas una vez en cada dispositivo.
          </p>
        </form>
      </div>
    </div>
  );
}
