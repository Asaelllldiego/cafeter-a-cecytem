import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Package, CheckCircle2, ChefHat, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import OrderProgress from '@/components/OrderProgress';
import OrderStatusFilter from '@/components/OrderStatusFilter';

const statusConfig = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'text-mustard-dark', bg: 'bg-mustard-light' },
  en_preparacion: { label: 'En preparación', icon: ChefHat, color: 'text-brand', bg: 'bg-brand-light' },
  listo: { label: 'Listo para recoger', icon: CheckCircle2, color: 'text-brand', bg: 'bg-brand-light' },
  entregado: { label: 'Entregado', icon: Package, color: 'text-mutedink', bg: 'bg-muted' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' }
};

export default function Orders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('todos');

  const { data, isLoading: loading } = useQuery({
    queryKey: ['myOrders', user?.id, statusFilter],
    queryFn: () => {
      const query = statusFilter === 'todos'
        ? { customer_user_id: user.id }
        : { customer_user_id: user.id, status: statusFilter };
      return base44.entities.Order.filter(query, { sort: '-created_date', limit: 50 }).then(r => r.items || []);
    },
    enabled: !!user && user.role !== 'admin',
  });
  const orders = data || [];

  // Avances en vivo: cualquier cambio de estado de mis pedidos
  // (pendiente → en_preparacion → listo → entregado) refresca la lista.
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type !== 'update' || !event.data) return;
      const o = event.data;
      if (o.customer_user_id !== user.id && o.created_by_id !== user.id) return;
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    });
    return unsub;
  }, [user, queryClient]);

  // El administrador no usa la sección de pedidos personales
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['myOrders'] }); }}>
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-3xl">
      <h1 className="font-display font-700 text-[28px] lg:text-[32px] text-foreground mb-1">Mis Pedidos</h1>
      <p className="text-[14px] text-mutedink mb-6">Rastrea tus pedidos activos y programados</p>

      {!loading && <OrderStatusFilter value={statusFilter} onChange={setStatusFilter} />}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : orders.length === 0 ? (
        statusFilter === 'todos' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="font-display font-600 text-[18px] text-foreground">No tienes pedidos aún</h3>
            <p className="text-[13px] text-mutedink mt-1">Cuando confirmes un pedido aparecerá aquí</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-[13px] text-mutedink">No hay pedidos con este estado</p>
            <button onClick={() => setStatusFilter('todos')}
              className="mt-3 px-4 py-2 rounded-pill bg-brand text-white text-[12px] font-700">
              Ver todos
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = statusConfig[o.status] || statusConfig.pendiente;
            const Icon = st.icon;
            return (
              <div key={o.id} className="bg-card rounded-[16px] border border-hair p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-700', st.bg, st.color)}>
                    <Icon className="w-3.5 h-3.5" /> {st.label}
                  </span>
                  <span className="text-[11px] text-mutedink">
                    {new Date(o.created_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <OrderProgress status={o.status} />

                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-mustard-dark" />
                  <span className="text-[13px] font-600 text-foreground">Recoger: {o.pickup_time}</span>
                  {o.customer_name && <span className="text-[12px] text-mutedink">· {o.customer_name}</span>}
                </div>

                <div className="space-y-1.5 mb-3">
                  {o.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[13px]">
                      <span className="text-foreground"><span className="font-600">{it.quantity}×</span> {it.name}</span>
                      <span className="text-mutedink">${(it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {o.notes && <p className="text-[12px] text-mutedink italic mb-2">"{o.notes}"</p>}

                <div className="flex justify-between items-baseline pt-2.5 border-t border-hair">
                  <span className="text-[12px] text-mutedink">{o.item_count} artículos</span>
                  <span className="font-display font-700 text-[16px] text-brand">${o.total.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}