import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Package, CheckCircle2, ChefHat, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'text-mustard-dark', bg: 'bg-mustard-light' },
  en_preparacion: { label: 'En preparación', icon: ChefHat, color: 'text-brand', bg: 'bg-brand-light' },
  listo: { label: 'Listo para recoger', icon: CheckCircle2, color: 'text-brand', bg: 'bg-brand-light' },
  entregado: { label: 'Entregado', icon: Package, color: 'text-mutedink', bg: 'bg-muted' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.filter({}, { sort: '-created_date', limit: 50 })
      .then(res => setOrders(res.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-3xl">
      <h1 className="font-display font-700 text-[28px] lg:text-[32px] text-ink mb-1">Mis Pedidos</h1>
      <p className="text-[14px] text-mutedink mb-6">Rastrea tus pedidos activos y programados</p>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-display font-600 text-[18px] text-ink">No tienes pedidos aún</h3>
          <p className="text-[13px] text-mutedink mt-1">Cuando confirmes un pedido aparecerá aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = statusConfig[o.status] || statusConfig.pendiente;
            const Icon = st.icon;
            return (
              <div key={o.id} className="bg-white rounded-[16px] border border-hair p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-700', st.bg, st.color)}>
                    <Icon className="w-3.5 h-3.5" /> {st.label}
                  </span>
                  <span className="text-[11px] text-mutedink">
                    {new Date(o.created_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-mustard-dark" />
                  <span className="text-[13px] font-600 text-ink">Recoger: {o.pickup_time}</span>
                  {o.customer_name && <span className="text-[12px] text-mutedink">· {o.customer_name}</span>}
                </div>

                <div className="space-y-1.5 mb-3">
                  {o.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[13px]">
                      <span className="text-ink"><span className="font-600">{it.quantity}×</span> {it.name}</span>
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
  );
}