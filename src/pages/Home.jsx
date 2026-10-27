import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PromoCarousel from '@/components/PromoCarousel';
import MenuCard from '@/components/MenuCard';
import CheckoutPanel from '@/components/CheckoutPanel';
import DaySelector, { todayWeekday } from '@/components/DaySelector';
import ScheduleBadge from '@/components/ScheduleBadge';
import FaqSection from '@/components/FaqSection';
import SiteFooter from '@/components/SiteFooter';
import RoleOnboarding from '@/components/RoleOnboarding';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '@/components/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';

const CAT_ORDER = ['Comida (diario)', 'Bebidas', 'Especiales', 'Higiene', 'Snacks', 'Postres'];
const CAT_META = {
  'Comida (diario)': { title: 'Comida del día', subtitle: 'Platillos que cambian cada día de la semana', daily: true, emoji: '🍽️' },
  'Bebidas': { title: 'Bebidas', subtitle: 'Café, té y más', emoji: '☕' },
  'Especiales': { title: 'Especiales', subtitle: 'Especialidades de la casa', emoji: '⭐' },
  'Higiene': { title: 'Higiene', subtitle: 'Artículos de cuidado personal', emoji: '🧴' },
  'Snacks': { title: 'Snacks', subtitle: 'Siempre disponibles', emoji: '🍪' },
  'Postres': { title: 'Postres', subtitle: 'Siempre disponibles', emoji: '🍰' },
};

export default function Home() {
  const isMobile = useIsMobile();
  const [day, setDay] = useState(todayWeekday());
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState('todas');
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.filter({}, { sort: '-popular', limit: 200 }).then(r => r.items || []),
  });
  const items = data || [];

  const available = items.filter(i => i.available !== false);
  const searching = q.trim().length > 0;
  const ql = q.trim().toLowerCase();
  const searchResults = searching ? available.filter(i => i.name.toLowerCase().includes(ql)) : [];

  const byCategory = useMemo(() => {
    const map = {};
    CAT_ORDER.forEach(c => { map[c] = []; });
    available.forEach(i => { if (map[i.category]) map[i.category].push(i); });
    return map;
  }, [available]);

  const sections = CAT_ORDER
    .map(c => ({ cat: c, ...CAT_META[c], list: c === 'Comida (diario)' ? (byCategory[c] || []).filter(i => i.day_of_week === day) : (byCategory[c] || []) }))
    .filter(s => s.list.length > 0);

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['menuItems'] }); }}>
    <RoleOnboarding />
    <div className="lg:flex">
      <div className="flex-1 min-w-0 px-4 lg:px-8 py-5 lg:py-7">
        <div className="hidden lg:block mb-4">
          <h1 className="font-display font-700 text-[32px] text-foreground leading-tight">¡Buen provecho! 🌮</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Pide tu comida favorita y recógela en el recreo</p>
        </div>

        <div className="mb-4">
          <ScheduleBadge showStatus />
        </div>

        <div className="mb-5">
          <PromoCarousel />
        </div>

        <div className="sticky top-14 lg:top-0 z-10 -mx-4 lg:-mx-8 px-4 lg:px-8 pb-3 pt-2 bg-background/95 backdrop-blur mb-5">
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto (café, gel, gerber...)"
              className="w-full pl-9 pr-9 py-2.5 rounded-pill border border-border bg-card text-[13px] focus:outline-none focus:border-brand" />
            {searching && (
              <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-full hover:bg-muted">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {!searching && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <FilterPill active={activeCat === 'todas'} onClick={() => setActiveCat('todas')}>Todo</FilterPill>
              {sections.map(s => (
                <FilterPill key={s.cat} active={activeCat === s.cat} onClick={() => setActiveCat(s.cat)}>
                  {s.emoji} {s.title.replace('Comida del día', 'Día')}
                </FilterPill>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : searching ? (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">{searchResults.length} resultado(s) para “{q}”</p>
            <Grid items={searchResults} empty="Sin coincidencias. Prueba con otro nombre." />
          </div>
        ) : (
          <div className="space-y-7">
            {sections
              .filter(s => activeCat === 'todas' || activeCat === s.cat)
              .map(s => (
                <Section key={s.cat} title={s.title} subtitle={s.subtitle}>
                  {s.daily && <DaySelector value={day} onChange={setDay} />}
                  <Grid items={s.list} empty={s.daily ? 'No hay comida programada para este día' : 'Sin productos'} />
                </Section>
              ))}
          </div>
        )}

        <div className="mt-10">
          <FaqSection />
        </div>

        <SiteFooter />
      </div>

      {/* Carrito de escritorio: solo en escritorio; en móvil se usa la hoja
          de la barra flotante. Evita un segundo formulario oculto en el DOM
          móvil, cuyo campo de nombre capta el tecleo del campo visible. */}
      {!isMobile && (
        <div className="hidden lg:block w-[340px] shrink-0 border-l border-border bg-card sticky top-0 h-screen overflow-hidden">
          <CheckoutPanel />
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={cn('shrink-0 inline-flex items-center px-4 py-2.5 min-h-[44px] rounded-pill text-[12px] font-600 transition-colors',
        active ? 'bg-brand text-white' : 'bg-card border border-border text-foreground hover:border-brand/40')}>
      {children}
    </button>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="font-display font-700 text-[19px] text-foreground leading-none">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="mb-3">{children}</div>
    </section>
  );
}

function Grid({ items, empty }) {
  if (!items || items.length === 0) {
    return <p className="text-[13px] text-muted-foreground py-6 text-center bg-card rounded-2xl border border-dashed border-border">{empty || 'Sin productos'}</p>;
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {items.map(item => <MenuCard key={item.id} item={item} />)}
    </div>
  );
}