import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Bell, X } from 'lucide-react';

export default function OrderAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState(0);
  const [newIds, setNewIds] = useState(new Set());
  const isNew = newIds.size > 0;

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    base44.entities.Order.count({ status: 'pendiente' }).then(c => setPending(c || 0)).catch(() => {});

    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const o = event.data;
        setPending(p => p + 1);
        setNewIds(prev => new Set([...prev, o.id]));
        toast({
          title: '🔔 Nuevo pedido',
          description: `${o.customer_name || 'Estudiante'} · ${o.item_count || 0} artículos · $${(o.total || 0).toFixed(2)} · ${o.pickup_time || ''}`,
        });
      }
    });
    return unsub;
  }, [user, toast]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="fixed z-40 top-4 right-4 lg:right-[260px]">
      {isNew && (
        <div className="flex items-center gap-2 mb-2 bg-mustard text-onaccent rounded-pill pl-3 pr-2 py-1.5 shadow-float animate-pulse-add">
          <Bell className="w-4 h-4" />
          <span className="text-[12px] font-700">{newIds.size} pedido(s) nuevo(s)</span>
          <button onClick={() => setNewIds(new Set())} className="grid place-items-center w-5 h-5 rounded-full hover:bg-black/10">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <a href="/admin" className="flex items-center gap-2 bg-card border border-hair rounded-pill px-3 py-1.5 shadow-card hover:border-brand/40 transition">
        <span className="relative grid place-items-center w-6 h-6">
          <Bell className="w-[18px] h-[18px] text-brand" />
          {pending > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-destructive text-white text-[10px] font-700">{pending}</span>}
        </span>
        <span className="text-[12px] font-600 text-foreground hidden sm:inline">Pedidos admin</span>
      </a>
    </div>
  );
}