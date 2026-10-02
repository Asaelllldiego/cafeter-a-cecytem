import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PromoCarousel from '@/components/PromoCarousel';
import MenuCard from '@/components/MenuCard';
import CheckoutPanel from '@/components/CheckoutPanel';
import DaySelector, { todayWeekday } from '@/components/DaySelector';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(todayWeekday());

  useEffect(() => {
    base44.entities.MenuItem.filter({}, { sort: '-popular', limit: 100 })
      .then(res => setItems(res.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const { comida, bebidas, snacks, postres } = useMemo(() => {
    const byDay = items.filter(i => i.category === 'Comida (diario)');
    const comidaDia = byDay.filter(i => i.day_of_week === day);
    return {
      comida: comidaDia,
      bebidas: items.filter(i => i.category === 'Bebidas'),
      snacks: items.filter(i => i.category === 'Snacks'),
      postres: items.filter(i => i.category === 'Postres'),
    };
  }, [items, day]);

  return (
    <div className="lg:flex">
      <div className="flex-1 min-w-0 px-4 lg:px-8 py-5 lg:py-7">
        <div className="hidden lg:block mb-5">
          <h1 className="font-display font-700 text-[32px] text-ink leading-tight">¡Buen provecho! 🌮</h1>
          <p className="text-[14px] text-mutedink mt-1">Pide tu comida favorita y recógela en el recreo</p>
        </div>

        <div className="mb-5">
          <PromoCarousel />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : (
          <div className="space-y-7">
            <Section title="Comida del día" subtitle="Platillos que cambian cada día de la semana">
              <DaySelector value={day} onChange={setDay} />
              <Grid items={comida} empty="No hay comida programada para este día" />
            </Section>

            <Section title="Bebidas" subtitle="Siempre disponibles">
              <Grid items={bebidas} />
            </Section>

            <Section title="Snacks" subtitle="Siempre disponibles">
              <Grid items={snacks} />
            </Section>

            <Section title="Postres" subtitle="Siempre disponibles">
              <Grid items={postres} />
            </Section>
          </div>
        )}
      </div>

      <div className="hidden lg:block w-[340px] shrink-0 border-l border-hair bg-white sticky top-0 h-screen overflow-hidden">
        <CheckoutPanel />
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="font-display font-700 text-[19px] text-ink leading-none">{title}</h2>
          {subtitle && <p className="text-[12px] text-mutedink mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="mb-3">{children}</div>
    </section>
  );
}

function Grid({ items, empty }) {
  if (!items || items.length === 0) {
    return <p className="text-[13px] text-mutedink py-6 text-center bg-white rounded-2xl border border-dashed border-hair">{empty || 'Sin productos'}</p>;
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {items.map(item => <MenuCard key={item.id} item={item} />)}
    </div>
  );
}