import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, Tag, User, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const ACTIVE_STATUSES = ['pendiente', 'en_preparacion', 'listo'];
const TAB_STACK_KEY = 'tabStack';

// Map any route to the tab it belongs to (root path), or null when it isn't a tab screen.
function tabForPath(p) {
  if (!p) return null;
  if (p === '/' || p.startsWith('/producto/')) return '/';
  if (p.startsWith('/admin/reportes')) return '/admin/reportes';
  if (p.startsWith('/admin')) return '/admin';
  if (p.startsWith('/pedidos')) return '/pedidos';
  if (p.startsWith('/promociones')) return '/promociones';
  if (p.startsWith('/perfil')) return '/perfil';
  return null;
}

function readStack() {
  try { return JSON.parse(sessionStorage.getItem(TAB_STACK_KEY) || '{}'); } catch { return {}; }
}
function writeStack(map) {
  try { sessionStorage.setItem(TAB_STACK_KEY, JSON.stringify(map)); } catch {}
}

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

  // Remember the last route visited within each tab so we can restore it when toggling tabs.
  useEffect(() => {
    const tab = tabForPath(location.pathname);
    if (!tab) return;
    const map = readStack();
    if (map[tab] !== location.pathname) {
      map[tab] = location.pathname;
      writeStack(map);
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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-hair pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(item => {
          const active = tabForPath(location.pathname) === item.path;
          const Icon = item.icon;
          return (
            <button key={item.path} type="button" onClick={() => {
              if (active) { navigate(item.path, { state: { _t: Date.now() } }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
              else {
                const last = readStack()[item.path] || item.path;
                navigate(last); window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
              className={cn('relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors w-full',
                active ? 'text-brand' : 'text-mutedink')}>
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-mustard text-onaccent text-[10px] font-700 border border-white">{item.badge}</span>
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