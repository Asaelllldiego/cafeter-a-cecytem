import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Tag, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const ACTIVE_STATUSES = ['pendiente', 'en_preparacion', 'listo'];

export default function BottomNav() {
  const location = useLocation();
  const [activeCount, setActiveCount] = useState(0);

  const load = async () => {
    try {
      const count = await base44.entities.Order.count({ status: { $in: ACTIVE_STATUSES } });
      setActiveCount(count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const unsub = base44.entities.Order.subscribe(() => load());
    return unsub;
  }, []);

  const items = [
    { label: 'Menú', path: '/', icon: HomeIcon },
    { label: 'Mis Pedidos', path: '/pedidos', icon: ClipboardList, badge: activeCount },
    { label: 'Promociones', path: '/promociones', icon: Tag },
    { label: 'Perfil', path: '/perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hair pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              className={cn('relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
                active ? 'text-brand' : 'text-mutedink')}>
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-mustard text-ink text-[10px] font-700 border border-white">{item.badge}</span>
                )}
              </span>
              <span className="text-[10px] font-600">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}