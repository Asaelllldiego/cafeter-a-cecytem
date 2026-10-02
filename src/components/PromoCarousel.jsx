import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronRight } from 'lucide-react';

export default function PromoCarousel() {
  const [promos, setPromos] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    base44.entities.Promotion.filter({}, { limit: 10 }).then(res => {
      setPromos(res.items || []);
    }).catch(() => setPromos([]));
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const t = setInterval(() => setActive(a => (a + 1) % promos.length), 5000);
    return () => clearInterval(t);
  }, [promos.length]);

  if (promos.length === 0) {
    return (
      <div className="rounded-[16px] h-[200px] bg-gradient-to-r from-brand to-brand-dark animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 -mx-4 px-4 lg:mx-0 lg:px-0">
        {promos.map((p, i) => (
          <div key={p.id || i}
            className={`snap-center shrink-0 w-[85%] lg:w-full rounded-[16px] overflow-hidden relative ${p.accent === 'brand' ? 'bg-brand' : 'bg-mustard'}`}>
            <div className="flex items-stretch min-h-[200px]">
              <div className="flex-1 p-6 flex flex-col justify-center text-white">
                {p.badge && (
                  <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-pill bg-white/20 text-[11px] font-600 mb-3">{p.badge}</span>
                )}
                <h3 className="font-display font-700 text-[24px] leading-tight">{p.title}</h3>
                <p className="text-[14px] opacity-90 mt-1.5 max-w-[260px]">{p.subtitle}</p>
              </div>
              {p.image_url && (
                <div className="w-[40%] relative shrink-0">
                  <img src={p.image_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {promos.length > 1 && (
        <div className="hidden lg:flex items-center justify-center gap-1.5 mt-3">
          {promos.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`h-1.5 rounded-pill transition-all ${i === active ? 'w-6 bg-brand' : 'w-1.5 bg-hair'}`} />
          ))}
        </div>
      )}
    </div>
  );
}