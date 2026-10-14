import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, ClipboardList, Clock, ChefHat, CheckCircle2, XCircle, RefreshCw, Lock, Tags, Package, BarChart3, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AdminProducts from '@/components/AdminProducts';
import TeacherPasswordManager from '@/components/TeacherPasswordManager';

const STATUS = [
  { key: 'pendiente', label: 'Pendiente', icon: Clock, cls: 'bg-amber-100 text-amber-700' },
  { key: 'en_preparacion', label: 'En preparación', icon: ChefHat, cls: 'bg-blue-100 text-blue-700' },
  { key: 'listo', label: 'Listo', icon: CheckCircle2, cls: 'bg-brand-light text-brand' },
  { key: 'entregado', label: 'Entregado', icon: CheckCircle2, cls: 'bg-green-100 text-green-700' },
  { key: 'cancelado', label: 'Cancelado', icon: XCircle, cls: 'bg-red-100 text-red-700' },
];
const FLOW = ['pendiente', 'en_preparacion', 'listo', 'entregado'];

export default function Admin() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [tab, setTab] = useState('pedidos');

  const load = async () => {
    setLoading(true);
    try {
      const [res, agg] = await Promise.all([
        base44.entities.Order.filter(filter === 'todos' ? {} : { status: filter }, { sort: '-created_date', limit: 50 }),
        base44.entities.Order.aggregate({ groupBy: 'status' }),
      ]);
      setOrders(res.items || []);
      const map = {};
      (agg.rows || []).forEach(r => { map[r.status] = r.count; });
      setCounts(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type === 'create') load();
    });
    return unsub;
  }, [user]);

  const setStatus = async (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      await base44.entities.Order.update(id, { status });
      load();
    } catch (e) {
      console.error(e);
      load();
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="grid place-items-center py-24 px-4">
        <div className="text-center">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-muted mx-auto mb-3"><Lock className="w-6 h-6 text-muted-foreground" /></div>
          <h2 className="font-display font-700 text-[20px] text-foreground">Acceso restringido</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">Solo administradores pueden gestionar pedidos.</p>
        </div>
      </div>
    );
  }

  const totalToday = Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-700 text-[28px] text-foreground leading-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand" /> Gestión de pedidos
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Administra y actualiza el estado de los pedidos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/reportes" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-brand-light text-brand text-[12px] font-600 hover:bg-brand hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4" /> Reportes
          </Link>
          <button onClick={load} className="grid place-items-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted">
            <RefreshCw className={cn('w-[18px] h-[18px] text-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('pedidos')}
          className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-[13px] font-600',
            tab === 'pedidos' ? 'bg-brand text-white' : 'bg-card border border-border text-foreground')}>
          <ClipboardList className="w-4 h-4" /> Pedidos
        </button>
        <button onClick={() => setTab('productos')}
          className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-[13px] font-600',
            tab === 'productos' ? 'bg-brand text-white' : 'bg-card border border-border text-foreground')}>
          <Package className="w-4 h-4" /> Productos
        </button>
        <button onClick={() => setTab('profesores')}
          className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-[13px] font-600',
            tab === 'profesores' ? 'bg-brand text-white' : 'bg-card border border-border text-foreground')}>
          <GraduationCap className="w-4 h-4" /> Profesores
        </button>
      </div>

      {tab === 'productos' ? (
        <AdminProducts />
      ) : tab === 'profesores' ? (
        <TeacherPasswordManager />
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Pendientes" value={counts.pendiente || 0} icon={Clock} cls="bg-amber-50 text-amber-700" />
        <Stat label="En preparación" value={counts.en_preparacion || 0} icon={ChefHat} cls="bg-blue-50 text-blue-700" />
        <Stat label="Listos" value={counts.listo || 0} icon={CheckCircle2} cls="bg-brand-light text-brand" />
        <Stat label="Total" value={totalToday} icon={Tags} cls="bg-muted text-foreground" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
        {['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado', 'todos'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('shrink-0 px-4 py-2 rounded-pill text-[12px] font-600 capitalize transition-colors',
              filter === s ? 'bg-brand text-white' : 'bg-card border border-border text-foreground hover:border-brand/40')}>
            {s.replace('_', ' ')} {s !== 'todos' && counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-[13px] text-muted-foreground">No hay pedidos en este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => <OrderRow key={o.id} order={o} onStatus={setStatus} />)}
        </div>
      )}
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

function OrderRow({ order, onStatus }) {
  const status = STATUS.find(s => s.key === order.status) || STATUS[0];
  const Icon = status.icon;
  const idx = FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const nextLabel = STATUS.find(s => s.key === next)?.label;

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
            {order.created_date && <> · {new Date(order.created_date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</>}
          </p>
        </div>
        <p className="font-display font-700 text-[18px] text-brand">${(order.total || 0).toFixed(2)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(order.items || []).map((it, i) => (
          <span key={i} className="text-[11px] bg-muted px-2 py-1 rounded-lg text-foreground">{it.quantity}× {it.name}</span>
        ))}
      </div>

      {order.notes && <p className="text-[12px] text-muted-foreground mt-2 italic">📝 {order.notes}</p>}

      <div className="mt-3 flex gap-2 flex-wrap">
        {next && (
          <button onClick={() => onStatus(order.id, next)}
            className="px-3.5 py-2 rounded-pill bg-brand text-white text-[12px] font-600 hover:bg-brand-dark">
            Marcar como {nextLabel}
          </button>
        )}
        {order.status !== 'cancelado' && order.status !== 'entregado' && (
          <button onClick={() => onStatus(order.id, 'cancelado')}
            className="px-3.5 py-2 rounded-pill bg-card border border-border text-destructive text-[12px] font-600 hover:bg-red-50">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}