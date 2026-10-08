import React from 'react';
import { cn } from '@/lib/utils';

const WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const dayMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };

export function todayWeekday() {
  return dayMap[new Date().getDay()] || 'Lunes';
}

export default function DaySelector({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {WEEK.map(day => {
        const active = day === value;
        const isToday = day === todayWeekday();
        return (
          <button key={day} onClick={() => onChange(day)}
            className={cn('shrink-0 inline-flex items-center px-4 py-2.5 min-h-[44px] rounded-pill text-[12px] font-600 whitespace-nowrap transition-colors relative',
              active ? 'bg-brand text-white' : 'bg-card text-foreground border border-border hover:border-brand/40')}>
            {day}
            {isToday && <span className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', active ? 'bg-mustard' : 'bg-brand')} />}
          </button>
        );
      })}
    </div>
  );
}