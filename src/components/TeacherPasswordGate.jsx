import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeacherArea } from '@/lib/TeacherAreaContext';
import { Lock, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';

export default function TeacherPasswordGate() {
  const { login } = useTeacherArea();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    const res = await login(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error === 'not_configured'
        ? 'El acceso al área aún no está configurado. Pide al administrador que habilite la contraseña.'
        : 'Contraseña no válida. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 lg:py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-3xl border border-border shadow-card p-7 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-brand-light text-brand mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="font-display font-700 text-[22px] text-foreground">Área de Profesores</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Introduce la contraseña compartida para acceder.</p>

          <form onSubmit={submit} className="mt-5 space-y-3 text-left">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Contraseña"
                autoFocus
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-card text-[14px] focus:outline-none focus:border-brand"
              />
            </div>

            {error && (
              <p className="text-[12px] text-destructive bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 rounded-pill bg-brand text-white font-display font-700 text-[15px] hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</> : 'Entrar al área'}
            </button>
          </form>

          <Link to="/" className="inline-flex items-center gap-1.5 mt-5 text-[12px] text-muted-foreground hover:text-brand">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al menú
          </Link>
        </div>
      </div>
    </div>
  );
}