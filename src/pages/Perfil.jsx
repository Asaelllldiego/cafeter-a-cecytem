import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, User, Mail, GraduationCap, Phone, Bell, Tag, Save, Check, ShieldCheck, Trash2, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRole, ROLE_TEACHER } from '@/lib/userRole';
import { useTheme, THEMES } from '@/lib/theme';
import MobileSelect from '@/components/MobileSelect';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export default function Perfil() {
  const { user, patchUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    phone: '',
    grade: '',
    group: '',
    shift: 'Matutino',
    student_id: '',
    notify_orders: true,
    notify_promos: true,
  });

  useEffect(() => {
    let mounted = true;
    base44.auth.me()
      .then(me => {
        if (!mounted) return;
        const d = me || {};
        setForm({
          phone: d.phone || '',
          grade: d.grade || '',
          group: d.group || '',
          shift: d.shift || 'Matutino',
          student_id: d.student_id || '',
          notify_orders: d.notify_orders !== false,
          notify_promos: d.notify_promos !== false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await base44.auth.updateMe({
        phone: form.phone,
        grade: form.grade,
        group: form.group,
        shift: form.shift,
        student_id: form.student_id,
        notify_orders: form.notify_orders,
        notify_promos: form.notify_promos,
      });
      // Patch the in-memory user from the save result instead of re-fetching
      // me(), which could 401 on a borderline session and redirect to /login.
      patchUser({
        ...(updated || {}),
        phone: form.phone,
        grade: form.grade,
        group: form.group,
        shift: form.shift,
        student_id: form.student_id,
        notify_orders: form.notify_orders,
        notify_promos: form.notify_promos,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      // Nunca dejar un guardado fallido en silencio: el usuario debe saber
      // si sus cambios se guardaron o no. Si la sesión expiró, decírselo.
      const expired = e && (e.status === 401 || e.status === 403);
      setError(expired
        ? 'Tu sesión expiró y tus cambios no se guardaron. Inicia sesión de nuevo e inténtalo otra vez.'
        : 'Tus cambios no se pudieron guardar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid place-items-center py-24"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>;
  }

  const isAdmin = user?.role === 'admin';
  const isTeacher = !isAdmin && getRole() === ROLE_TEACHER;

  const roleBadge = isAdmin
    ? { cls: 'bg-brand text-white', icon: <ShieldCheck className="w-3 h-3" />, label: 'Administrador' }
    : isTeacher
      ? { cls: 'bg-blue-100 text-blue-700', icon: <GraduationCap className="w-3 h-3" />, label: 'Profesor' }
      : { cls: 'bg-muted text-foreground', icon: null, label: 'Estudiante' };

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-3xl mx-auto">
      <h1 className="font-display font-700 text-[26px] text-foreground leading-tight mb-1">Mi perfil</h1>
      <p className="text-[13px] text-muted-foreground mb-6">Revisa tu información y ajusta tus preferencias.</p>

      {/* Identidad */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-card mb-5">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-brand-light text-brand">
            <User className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-700 text-[20px] text-foreground truncate">{user?.full_name || 'Estudiante'}</p>
            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5" /> {user?.email || '—'}</p>
            <span className={cn('inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-pill text-[10px] font-700', roleBadge.cls)}>
              {roleBadge.icon}{roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Historial escolar básico */}
      <Section title="Historial escolar" icon={GraduationCap} subtitle="Datos básicos de tu información estudiantil">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grado">
            <input value={form.grade} onChange={e => update('grade', e.target.value)} placeholder="Ej. 5° semestre"
              className={inputCls} />
          </Field>
          <Field label="Grupo">
            <input value={form.group} onChange={e => update('group', e.target.value)} placeholder="Ej. B"
              className={inputCls} />
          </Field>
          <Field label="Turno">
            <MobileSelect value={form.shift} onValueChange={v => update('shift', v)} className={inputCls} placeholder="Turno"
              options={[{ value: 'Matutino', label: 'Matutino' }, { value: 'Vespertino', label: 'Vespertino' }]} />
          </Field>
          <Field label="Matrícula">
            <input value={form.student_id} onChange={e => update('student_id', e.target.value)} placeholder="Ej. 2026-001"
              className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Preferencias de contacto */}
      <Section title="Contacto" icon={Phone} subtitle="Cómo podemos contactarte">
        <Field label="Teléfono / WhatsApp">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Ej. 55 1234 5678"
              className={cn(inputCls, 'pl-9')} />
          </div>
        </Field>
      </Section>

      {/* Preferencias de notificaciones */}
      <Section title="Apariencia" icon={Sun} subtitle="Elige cómo se ve la app">
        <div className="grid grid-cols-3 gap-2.5">
          {THEMES.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)}
              className={cn('flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border text-[12px] font-600 transition-all',
                theme === t.value ? 'border-brand bg-brand-light text-brand' : 'border-border bg-card text-foreground hover:border-brand/40')}>
              <span className="text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
          {theme === 'auto' ? 'La app seguirá la configuración de tu dispositivo.' : `Tema ${theme === 'dark' ? 'oscuro' : 'claro'} aplicado.`}
        </p>
      </Section>

      <Section title="Notificaciones" icon={Bell} subtitle="Elige qué avisos quieres recibir">
        <Toggle
          icon={Bell}
          title="Estado de mis pedidos"
          desc="Avísame cuando mi pedido esté en preparación y listo para recoger."
          checked={form.notify_orders}
          onChange={v => update('notify_orders', v)}
        />
        <Toggle
          icon={Tag}
          title="Promociones y novedades"
          desc="Recibe ofertas especiales y nuevos productos de la cooperativa."
          checked={form.notify_promos}
          onChange={v => update('notify_promos', v)}
        />
      </Section>

      <button onClick={save} disabled={saving}
        className={cn('w-full flex items-center justify-center gap-2 py-3.5 rounded-pill text-[15px] font-700 transition-all mt-2',
          saved ? 'bg-brand-dark text-white' : 'bg-brand text-white hover:bg-brand-dark active:scale-[0.99]')}>
        {saving ? <Loader2 className="w-5 h-5 animate-spin" />
          : saved ? <><Check className="w-5 h-5" /> Cambios guardados</>
          : <><Save className="w-5 h-5" /> Guardar cambios</>}
      </button>

      {error && (
        <p className="mt-2 text-[13px] text-destructive bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">{error}</p>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-pill text-[15px] font-700 mt-3 bg-red-50 text-destructive border border-red-200 hover:bg-red-100">
            <Trash2 className="w-5 h-5" /> Eliminar cuenta
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se eliminarán tus datos de perfil, tu historial de pedidos y tus preferencias, y no podrás recuperar tu cuenta ni tus pedidos anteriores. Si solo quieres salir, cierra sesión en su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try { await base44.functions.invoke('deleteMyAccount', {}); } catch (e) { /* borrado best-effort */ }
                try { await base44.auth.logout('/login'); } catch (e) { window.location.href = '/login'; }
              }}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-border bg-card text-[13px] focus:outline-none focus:border-brand';

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-brand-light text-brand"><Icon className="w-4.5 h-4.5" /></div>
        <div>
          <h2 className="font-display font-700 text-[16px] text-foreground leading-none">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-600 text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ icon: Icon, title, desc, checked, onChange }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-foreground shrink-0"><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-600 text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5', checked ? 'bg-brand' : 'bg-muted')}>
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );
}