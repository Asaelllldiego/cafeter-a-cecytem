import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTeacherArea } from '@/lib/TeacherAreaContext';
import TeacherPasswordGate from '@/components/TeacherPasswordGate';
import { Loader2, LogOut, GraduationCap, ClipboardList, Clock, ChefHat, CheckCircle2, Utensils, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = [
  { key: 'pendiente', label: 'Pendiente', icon: Clock, cls: 'bg-amber-100 text-amber-700' },
  { key: 'en_preparacion', label: 'En preparación', icon: ChefHat, cls: 'bg-blue-100 text-blue-700' },
  { key: 'listo', label: 'Listo', icon: CheckCircle2, cls: 'bg-brand-light text-brand' },
  { key: 'entregado', label: 'Entregado', icon: CheckCircle2, cls: 'bg-green-100 text-green-700' },
  { key: 'cancelado', label: 'Cancelado', icon: ClipboardList, cls: 'bg-red-100 text-red-700' },
];

export default function TeacherArea() {
  const { isAuthed, logout } = useTeacherArea();
  if (!isAuthed) return <TeacherPasswordGate />;
  return <TeacherAreaContent onLogout={logout} />;
}

function TeacherAreaContent({ onLogout }) {
  const { session, clearIfInvalid } = useTeacherArea();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await base44.functions.invoke('getTeacherAreaData', { token: session.token, version: session.version });
      const d = res.data || {};
      if (d.ok) {
        setData(d);
      } else if (d.error === 'unauthorized' || d.error === 'not_configured') {
        clearIfInvalid();
      } else {
        setErr('No se pudo cargar el área. Inténtalo de nuevo.');
      }
    } catch {
      setErr('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = (data && data.counts) || {};

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="font-display font-700 text-[26px] text-foreground leading-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-brand" /> Área de Profesores
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Vista de seguimiento de pedidos y menú del día</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="grid place-items-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted">
            <RefreshCw className={cn('w-[18px] h-[18px] text-foreground', loading && 'animate-spin')} />
          </button>
          <button onClick={onLogout} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-card border border-border text-foreground text-[12px] font-600 hover:bg-muted">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : err ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-[13px] text-muted-foreground">{err}</p>
          <button onClick={load} className="mt-3 px-4 py-2 rounded-pill bg-brand text-white text-[12px] font-600">Reintentar</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat label="Pendientes" value={counts.pendiente || 0} icon={Clock} cls="bg-amber-50 text-amber-700" />
            <Stat label="En preparación" value={counts.en_preparacion || 0} icon={ChefHat} cls="bg-blue-50 text-blue-700" />
            <Stat label="Listos" value={counts.listo || 0} icon={CheckCircle2} cls="bg-brand-light text-brand" />
            <Stat label="Entregados" value={counts.entregado || 0} icon={CheckCircle2} cls="bg-green-50 text-green-700" />
          </div>

          <section className="mb-7">
            <h2 className="font-display font-700 text-[18px] text-foreground mb-3 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand" /> Pedidos activos
            </h2>
            {(data && data.orders && data.orders.length) ? (
              <div className="space-y-3">
                {data.orders.map((o, i) => <OrderRow key={i} order={o} />)}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-6 text-center bg-card rounded-2xl border border-dashed border-border">No hay pedidos activos</p>
            )}
          </section>

          <section>
            <h2 className="font-display font-700 text-[18px] text-foreground mb-3 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand" /> Menú disponible
            </h2>
            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              {(data && data.menu && data.menu.length) ? data.menu.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-600 text-foreground truncate">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.category}{m.day_of_week ? ` · ${m.day_of_week}` : ''}</p>
                  </div>
                  <span className="font-display font-700 text-[14px] text-brand">${(m.price || 0).toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-[13px] text-muted-foreground px-4 py-6 text-center">Sin productos</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, cls }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3.5 shadow-card">
      <div className={cn('grid place-items-center w-8 h-8 rounded-xl mb-2', cls)}><Icon className="w-4 h-4" /></div>
      <p className="font-display font-700 text-[22px] text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function OrderRow({ order }) {
  const status = STATUS.find((s) => s.key === order.status) || STATUS[0];
  const Icon = status.icon;
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-700 text-[15px] text-foreground">{order.customer_name || 'Estudiante'}</p>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-600', status.cls)}>
              <Icon className="w-3 h-3" /> {status.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {order.pickup_time || '—'} · {order.item_count || 0} artículos
          </p>
        </div>
        <p className="font-display font-700 text-[18px] text-brand">${(order.total || 0).toFixed(2)}</p>
      </div>
      {order.items && order.items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {order.items.map((it, i) => (
            <span key={i} className="text-[11px] bg-muted px-2 py-1 rounded-lg text-foreground">{it.quantity}× {it.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}