import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TeacherPasswordManager() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!next || next.length < 4) { setError('La nueva contraseña debe tener al menos 4 caracteres.'); return; }
    if (next !== confirm) { setError('La confirmación no coincide con la nueva contraseña.'); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('setTeacherPassword', { current_password: current, new_password: next });
      const d = res.data || {};
      if (d.ok) {
        setMsg('Contraseña actualizada. Las sesiones anteriores del Área de Profesores se cerraron.');
        setCurrent(''); setNext(''); setConfirm('');
      } else if (d.error === 'current_required') {
        setError('Debes escribir la contraseña actual para cambiarla.');
      } else if (d.error === 'current_invalid') {
        setError('La contraseña actual no es válida.');
      } else if (d.error === 'forbidden') {
        setError('Solo el administrador puede cambiar esta contraseña.');
      } else if (d.error === 'weak') {
        setError('La nueva contraseña es demasiado corta.');
      } else {
        setError('No se pudo actualizar la contraseña.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-brand-light text-brand"><KeyRound className="w-5 h-5" /></div>
        <h2 className="font-display font-700 text-[18px] text-foreground">Contraseña del Área de Profesores</h2>
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">
        Esta contraseña da acceso solo al Área de Profesores, sin permisos de administrador. Al cambiarla, las sesiones anteriores dejan de funcionar.
      </p>

      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-4 space-y-3.5">
        <Field label="Contraseña actual (requerida si ya existe una)">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" className={inputCls} autoComplete="current-password" />
        </Field>
        <Field label="Nueva contraseña">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 4 caracteres" className={inputCls} autoComplete="new-password" />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la nueva contraseña" className={inputCls} autoComplete="new-password" />
        </Field>

        {error && <p className="text-[12px] text-destructive bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {msg && (
          <p className="text-[12px] text-brand bg-brand-light border border-brand/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">La contraseña se guarda como hash seguro en el servidor. Nunca se muestra en texto plano.</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-pill bg-brand text-white text-[13px] font-700 hover:bg-brand-dark disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-xl border border-hair bg-card text-[13px] focus:outline-none focus:border-brand';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-600 uppercase tracking-wide text-mutedink mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}