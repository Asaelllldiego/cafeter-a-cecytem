import React, { useState } from 'react';
import { Plus, Clock, Flame } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { cn } from '@/lib/utils';

export default function MenuCard({ item }) {
  const { addItem } = useCart();
  const [pulsed, setPulsed] = useState(false);
  const outOfStock = item.available === false || item.stock <= 0;
  const lowStock = item.available !== false && item.stock > 0 && item.stock <= 3;
  const fallbackEmoji = item.emoji || (item.category === 'Bebidas' ? '🥤'
    : item.category === 'Especiales' ? '⭐'
    : item.category === 'Higiene' ? '🧴'
    : item.category === 'Postres' ? '🍰'
    : item.category === 'Snacks' ? '🍪'
    : '🍽️');

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(item);
    setPulsed(true);
    setTimeout(() => setPulsed(false), 300);
  };

  return (
    <div className="group relative bg-white rounded-[16px] border border-hair overflow-hidden shadow-card hover:shadow-float transition-shadow">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-mutedink text-3xl">{fallbackEmoji}</div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {item.popular && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-mustard text-ink text-[10px] font-700">
              <Flame className="w-3 h-3" /> Popular
            </span>
          )}
          {lowStock && (
            <span className="px-2 py-1 rounded-pill bg-destructive/10 text-destructive text-[10px] font-600">¡Solo {item.stock}!</span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-ink/50 grid place-items-center">
            <span className="px-3 py-1.5 rounded-pill bg-white text-ink text-[12px] font-700">Agotado</span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-600 text-[15px] text-ink leading-snug">{item.name}</h3>
          <span className="flex items-center gap-1 text-[11px] text-mutedink shrink-0 mt-0.5">
            <Clock className="w-3 h-3" />{item.prep_time}
          </span>
        </div>
        <p className="text-[12px] text-mutedink mt-1 line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-700 text-[18px] text-brand">${item.price.toFixed(2)}</span>
            {item.discount > 0 && (
              <span className="text-[11px] text-mutedink line-through">${(item.price * (1 + item.discount)).toFixed(2)}</span>
            )}
          </div>
          <button onClick={handleAdd} disabled={outOfStock}
            className={cn('grid place-items-center w-9 h-9 rounded-pill transition-all',
              outOfStock ? 'bg-muted text-mutedink cursor-not-allowed' : 'bg-mustard text-ink hover:bg-mustard-dark hover:text-white active:scale-90',
              pulsed && 'animate-pulse-add')}>
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}