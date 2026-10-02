import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Lock, TrendingUp, ShoppingBag, DollarSign, Package, BarChart3, Calendar, Award } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#006B3F', '#FFB800', '#3B82F6', '#EF4444', '#A855F7', '#EC4899'];

export default function Reportes() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.filter({ status: { $ne: 'cancelado' } }, { sort: '-created_date', limit: 500 })
      .then(res => setOrders(res.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (i.quantity || 0), 0), 0);
    const avgTicket = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, totalItems, avgTicket };
  }, [orders]);

  const dailyData = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!o.created_date) return;
      const d = new Date(o.created_date);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (o.total || 0);
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([dia, total]) => ({ dia, total: Math.round(total * 100) / 100 }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = {};
    orders.forEach(o => (o.items || []).forEach(i => {
      const name = i.name || 'Sin nombre';
      map[name] = (map[name] || 0) + (i.quantity || 0);
    }));
    return Object.entries(map)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
  }, [orders]);

  const statusData = useMemo(() => {
    const labels = { pendiente: 'Pendiente', en_preparacion: 'En preparación', listo: 'Listo', entregado: 'Entregado' };
    const map = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [orders]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="grid place-items-center py-24 px-4">
        <div className="text-center">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-muted mx-auto mb-3"><Lock className="w-6 h-6 text-mutedink" /></div>
          <h2 className="font-display font-700 text-[20px] text-ink">Acceso restringido</h2>
          <p className="text-[13px] text-mutedink mt-1.5">Solo administradores pueden ver los reportes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="grid place-items-center py-24"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7">
      <h1 className="font-display font-700 text-[26px] text-ink leading-tight flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-brand" /> Reportes de ventas
      </h1>
      <p className="text-[13px] text-mutedink mt-1 mb-6">Resumen de ventas, productos más vendidos y ganancias diarias.</p>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Ingresos totales" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} cls="bg-brand-light text-brand" />
        <Stat label="Pedidos" value={stats.totalOrders} icon={ShoppingBag} cls="bg-amber-50 text-amber-700" />
        <Stat label="Artículos vendidos" value={stats.totalItems} icon={Package} cls="bg-blue-50 text-blue-700" />
        <Stat label="Ticket promedio" value={`$${stats.avgTicket.toFixed(2)}`} icon={TrendingUp} cls="bg-purple-50 text-purple-700" />
      </div>

      {/* Ganancias diarias */}
      <Card title="Ganancias diarias" subtitle="Últimos 14 días con ventas" icon={Calendar}>
        {dailyData.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006B3F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#006B3F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E4DE" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6F7972' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6F7972' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={v => `$${Number(v).toFixed(2)}`} contentStyle={{ borderRadius: 12, border: '1px solid #E0E4DE', fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#006B3F" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {/* Top productos */}
        <Card title="Productos más vendidos" subtitle="Por unidades" icon={Award}>
          {topProducts.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E4DE" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6F7972' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#1A1C1E' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E0E4DE', fontSize: 12 }} />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Estados de pedidos */}
        <Card title="Pedidos por estado" subtitle="Distribución actual" icon={Package}>
          {statusData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E0E4DE', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Tabla top productos */}
      {topProducts.length > 0 && (
        <Card title="Ranking de productos" subtitle="Detalle por unidades vendidas" icon={Award}>
          <div className="space-y-1.5">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 py-2 border-b border-hair last:border-0">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-light text-brand text-[12px] font-700">{i + 1}</span>
                <span className="flex-1 text-[13px] font-600 text-ink truncate">{p.name}</span>
                <span className="text-[13px] font-700 text-brand">{p.cantidad} u.</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, cls }) {
  return (
    <div className="bg-white rounded-2xl border border-hair p-3.5 shadow-card">
      <div className={`grid place-items-center w-8 h-8 rounded-xl mb-2 ${cls}`}><Icon className="w-4 h-4" /></div>
      <p className="font-display font-700 text-[20px] text-ink leading-none truncate">{value}</p>
      <p className="text-[11px] text-mutedink mt-1">{label}</p>
    </div>
  );
}

function Card({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-hair p-4 lg:p-5 shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="grid place-items-center w-8 h-8 rounded-xl bg-brand-light text-brand"><Icon className="w-4 h-4" /></div>
        <div>
          <h2 className="font-display font-700 text-[15px] text-ink leading-none">{title}</h2>
          {subtitle && <p className="text-[11px] text-mutedink mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="grid place-items-center h-[200px] text-[12px] text-mutedink">Sin datos suficientes para mostrar</div>;
}