import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Tag, User, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const ACTIVE_STATUSES = ['pendiente', 'en_preparacion', 'listo'];
const MENU_SUBROUTE_KEY = 'lastMenuSubroute';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
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

  // Record the most recently visited menu-tab sub-route so we can return to it.
  useEffect(() => {
    if (location.pathname.startsWith('/producto/')) {
      try { sessionStorage.setItem(MENU_SUBROUTE_KEY, location.pathname); } catch (e) {}
    }
  }, [location.pathname]);

  const userItems = [
    { label: 'Menú', path: '/', icon: HomeIcon },
    { label: 'Mis Pedidos', path: '/pedidos', icon: ClipboardList, badge: activeCount },
    { label: 'Promociones', path: '/promociones', icon: Tag },
    { label: 'Perfil', path: '/perfil', icon: User },
  ];
  const adminItems = [
    { label: 'Menú', path: '/', icon: HomeIcon },
    { label: 'Admin', path: '/admin', icon: ShieldCheck, badge: activeCount },
    { label: 'Reportes', path: '/admin/reportes', icon: Tag },
    { label: 'Perfil', path: '/perfil', icon: User },
  ];
  const items = isAdmin ? adminItems : userItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hair pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button key={item.path} type="button" onClick={() => {
              if (item.path === '/') {
                if (active) { navigate('/', { state: { _t: Date.now() } }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                else if (location.pathname.startsWith('/producto/')) { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                else {
                  let last = '';
                  try { last = sessionStorage.getItem(MENU_SUBROUTE_KEY) || ''; } catch (e) {}
                  navigate(last || '/'); window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              } else {
                if (active) { navigate(item.path, { state: { _t: Date.now() } }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                else navigate(item.path);
              }
            }}
              className={cn('relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors w-full',
                active ? 'text-brand' : 'text-mutedink')}>
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-mustard text-ink text-[10px] font-700 border border-white">{item.badge}</span>
                )}
              </span>
              <span className="text-[10px] font-600">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}