import React from 'react';
import { CheckCircle2, Clock, ChefHat, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ruta de preparación de un pedido. Los pedidos cancelados no muestran
// la barra (la etiqueta roja ya lo comunica).
const STAGES = [
  { id: 'pendiente', label: 'Pendiente', icon: Clock },
  { id: 'en_preparacion', label: 'Preparación', icon: ChefHat },
  { id: 'listo', label: 'Listo', icon: CheckCircle2 },
  { id: 'entregado', label: 'Entregado', icon: Package }
];

export default function OrderProgress({ status }) {
  if (status === 'cancelado') return null;
  const current = Math.max(0, STAGES.findIndex(s => s.id === status));

  return (
    <div className="flex items-start justify-between mb-3 px-0.5">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <div className={cn('flex-1 h-0.5 rounded-full mt-[13px] mx-0.5',
                i <= current ? 'bg-brand' : 'bg-muted')} />
            )}
            <div className="flex flex-col items-center gap-1 w-14 shrink-0">
              <div className={cn('grid place-items-center w-7 h-7 rounded-full border',
                done || active ? 'bg-brand border-brand text-white' : 'bg-card border-hair text-mutedink')}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={cn('text-[9.5px] font-600 text-center leading-tight',
                active ? 'text-brand' : 'text-mutedink')}>{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}