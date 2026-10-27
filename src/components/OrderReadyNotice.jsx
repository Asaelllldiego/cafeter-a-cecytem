import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, X } from 'lucide-react';

// Aviso en pantalla del cliente cuando su pedido pasa a 'listo':
// un toast inmediato + una pastilla flotante persistente que enlaza a /pedidos.
// Solo para clientes; los administradores usan OrderAlerts.
export default function OrderReadyNotice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [readyIds, setReadyIds] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());
  const notified = useRef(new Set());

  useEffect(() => {
    if (!user || user.role === 'admin') return;

    // Pedidos que ya estaban listos al abrir la app: solo pastilla, sin toast.
    base44.entities.Order.filter({ customer_user_id: user.id, status: 'listo' }, { limit: 10 })
      .then(r => setReadyIds(prev => new Set([...prev, ...(r.items || []).map(o => o.id)])))
      .catch(() => {});

    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type !== 'update' || !event.data) return;
      const o = event.data;
      if (o.status !== 'listo') return;
      if (o.customer_user_id !== user.id && o.created_by_id !== user.id) return;
      setReadyIds(prev => { const n = new Set(prev); n.add(o.id); return n; });
      if (!notified.current.has(o.id)) {
        notified.current.add(o.id);
        toast({
          title: '🎉 ¡Tu pedido está listo!',
          description: `Pasa a recogerlo en la cooperativa${o.pickup_time ? ` · ${o.pickup_time}` : ''}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    });
    return unsub;
  }, [user, toast, queryClient]);

  if (!user || user.role === 'admin') return null;

  const visible = [...readyIds].filter(id => !dismissed.has(id));
  if (visible.length === 0) return null;

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  return (
    <div className="fixed z-40 top-20 lg:top-4 right-4 space-y-2 max-w-[calc(100vw-2rem)]">
      {visible.map(id => (
        <div key={id} className="flex items-center gap-2 bg-brand text-white rounded-pill pl-3 pr-2 py-1.5 shadow-float animate-pulse-add">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <Link to="/pedidos" className="text-[12px] font-700 hover:underline">¡Tu pedido está listo! Ver detalle</Link>
          <button onClick={() => dismiss(id)} aria-label="Cerrar aviso" className="grid place-items-center w-5 h-5 rounded-full hover:bg-black/10">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}