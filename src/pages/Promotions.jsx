import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Tag } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

export default function Promotions() {
  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => base44.entities.Promotion.filter({}, { limit: 20 }).then(r => r.items || []),
  });
  const promos = data || [];

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['promotions'] }); }}>
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-4xl">
      <h1 className="font-display font-700 text-[28px] lg:text-[32px] text-foreground mb-1">Promociones</h1>
      <p className="text-[14px] text-mutedink mb-6">Combos y descuentos exclusivos para estudiantes</p>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="font-display font-600 text-[18px] text-foreground">No hay promociones activas</h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promos.map(p => (
            <div key={p.id} className={`rounded-[16px] overflow-hidden ${p.accent === 'brand' ? 'bg-brand' : 'bg-mustard'} text-white shadow-card`}>
              <div className="p-6">
                {p.badge && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white/20 text-[11px] font-600 mb-3">
                    <Tag className="w-3 h-3" /> {p.badge}
                  </span>
                )}
                <h3 className="font-display font-700 text-[22px] leading-tight">{p.title}</h3>
                <p className="text-[14px] opacity-90 mt-2">{p.subtitle}</p>
              </div>
              {p.image_url && (
                <div className="h-32 overflow-hidden">
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}