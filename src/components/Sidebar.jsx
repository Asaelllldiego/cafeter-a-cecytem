import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Home, ClipboardList, Tag, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Menú', path: '/', icon: Home },
  { label: 'Mis Pedidos', path: '/pedidos', icon: ClipboardList },
  { label: 'Promociones', path: '/promociones', icon: Tag },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[240px] border-r border-hair bg-white flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-[72px] border-b border-hair">
        <div className="grid place-items-center w-10 h-10 rounded-2xl bg-brand text-white">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display font-700 text-[17px] leading-none text-ink">CECYTEM</p>
          <p className="text-[11px] text-mutedink mt-0.5">Cafetería · Cooperativa</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-pill text-sm font-500 transition-colors',
                active ? 'bg-brand text-white' : 'text-ink hover:bg-muted')}>
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
        <div className="pt-3 mt-3 border-t border-hair">
          <p className="px-3 text-[11px] font-600 uppercase tracking-wider text-mutedink mb-2">Accesos rápidos</p>
          <div className="px-3 py-2.5 rounded-2xl bg-mustard-light flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-mustard-dark" />
            <div>
              <p className="text-[13px] font-600 text-ink leading-none">Pedidos programados</p>
              <p className="text-[11px] text-mutedink mt-1">Receso 1 · 10:30 am</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-hair">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-muted cursor-pointer">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-brand-light text-brand">
            <User className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-600 text-ink truncate">Estudiante</p>
            <p className="text-[11px] text-mutedink truncate">Inicia sesión</p>
          </div>
        </div>
      </div>
    </aside>
  );
}