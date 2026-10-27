import React from 'react';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'en_preparacion', label: 'En preparación' },
  { id: 'listo', label: 'Listo' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cancelado', label: 'Cancelado' }
];

export default function OrderStatusFilter({ value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 mb-4">
      {FILTERS.map(f => (
        <button key={f.id} onClick={() => onChange(f.id)}
          className={cn('shrink-0 px-3.5 py-1.5 rounded-pill text-[12px] font-600 whitespace-nowrap transition-colors',
            value === f.id ? 'bg-brand text-white' : 'bg-card border border-hair text-foreground')}>
          {f.label}
        </button>
      ))}
    </div>
  );
}