import React, { useMemo, useState } from 'react';
import { useTeacherArea } from '@/lib/TeacherAreaContext';
import TeacherPasswordGate from '@/components/TeacherPasswordGate';
import MenuCard from '@/components/MenuCard';
import CheckoutPanel from '@/components/CheckoutPanel';
import DaySelector, { todayWeekday } from '@/components/DaySelector';
import ScheduleBadge from '@/components/ScheduleBadge';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, X, LogOut, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// Mismas categorías y metadatos que Inicio, para que el catálogo sea
// consistente entre ambas secciones.
const CAT_ORDER = ['Comida (diario)', 'Bebidas', 'Especiales', 'Higiene', 'Snacks', 'Postres'];
const CAT_META = {
  'Comida (diario)': { title: 'Comida del día', subtitle: 'Platillos que cambian cada día de la semana', daily: true, emoji: '🍽️' },
  'Bebidas': { title: 'Bebidas', subtitle: 'Café, té y más', emoji: '☕' },
  'Especiales': { title: 'Especiales', subtitle: 'Especialidades de la casa', emoji: '⭐' },
  'Higiene': { title: 'Higiene', subtitle: 'Artículos de cuidado personal', emoji: '🧴' },
  'Snacks': { title: 'Snacks', subtitle: 'Siempre disponibles', emoji: '🍪' },
  'Postres': { title: 'Postres', subtitle: 'Siempre disponibles', emoji: '🍰' },
};

export default function TeacherArea() {
  const { isAuthed, logout } = useTeacherArea();
  if (!isAuthed) return <TeacherPasswordGate />;
  return <TeacherShop onLogout={logout} />;
}

function TeacherShop({ onLogout }) {
  const [day, setDay] = useState(todayWeekday());
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState('todas');
  // Se reutiliza el mismo queryKey de Inicio -> mismo catálogo en caché,
  // sin duplicar datos ni peticiones.
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
    <div className="lg:flex">
      <div className="flex-1 min-w-0 px-4 lg:px-8 py-5 lg:py-7">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display font-700 text-[26px] lg:text-[32px] text-foreground leading-tight flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-brand" /> Área de Maestros
            </h1>
            <p className="text-[13px] lg:text-[14px] text-muted-foreground mt-1">Consulta el menú y haz tu pedido para recogerlo en el recreo</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-card border border-border text-foreground text-[12px] font-600 hover:bg-muted shrink-0">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>

        <div className="mb-4">
          <ScheduleBadge showStatus />
        </div>

        <div className="sticky top-14 lg:top-0 z-10 -mx-4 lg:-mx-8 px-4 lg:px-8 pb-3 pt-2 bg-background/95 backdrop-blur mb-5">
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto (café, torta, agua...)"
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
      </div>

      {/* Carrito de escritorio: reutiliza el mismo CheckoutPanel de Inicio */}
      <div className="hidden lg:block w-[340px] shrink-0 border-l border-border bg-card sticky top-0 h-screen overflow-hidden">
        <CheckoutPanel />
      </div>
    </div>
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