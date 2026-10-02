import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PromoCarousel from '@/components/PromoCarousel';
import CategoryFilter from '@/components/CategoryFilter';
import MenuCard from '@/components/MenuCard';
import CheckoutPanel from '@/components/CheckoutPanel';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todos');

  useEffect(() => {
    base44.entities.MenuItem.filter({}, { sort: '-popular', limit: 50 })
      .then(res => setItems(res.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === 'Todos' ? items : items.filter(i => i.category === category);

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

        <CategoryFilter active={category} onChange={setCategory} />

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
            {filtered.map(item => <MenuCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      <div className="hidden lg:block w-[340px] shrink-0 border-l border-hair bg-white sticky top-0 h-screen overflow-hidden">
        <CheckoutPanel />
      </div>
    </div>
  );
}