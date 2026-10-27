import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OPEN_START = 7;  // 7:00 AM
export const OPEN_END = 17;   // 5:00 PM
export const SCHEDULE_TEXT = '7:00 AM — 5:00 PM';

export function isWithinSchedule(date = new Date()) {
  const h = date.getHours();
  return h >= OPEN_START && h < OPEN_END;
}

// Próxima apertura: las 7:00 AM de hoy si aún no abre, o del día siguiente.
export function nextOpeningInstant(date = new Date()) {
  const d = new Date(date);
  d.setHours(OPEN_START, 0, 0, 0);
  if (d <= date) d.setDate(d.getDate() + 1);
  return d;
}

export default function ScheduleBadge({ className, showStatus = true }) {
  const open = isWithinSchedule();
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-card border border-hair', className)}>
      <Clock className="w-3.5 h-3.5 text-brand" />
      <span className="text-[12px] font-600 text-foreground">Horario: {SCHEDULE_TEXT}</span>
      {showStatus && (
        <span className={cn('text-[10px] font-700 px-1.5 py-0.5 rounded-pill', open ? 'bg-brand-light text-brand' : 'bg-red-100 text-red-700')}>
          {open ? 'Abierto' : 'Cerrado'}
        </span>
      )}
    </div>
  );
}