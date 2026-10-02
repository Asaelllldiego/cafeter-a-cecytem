import React from 'react';
import { cn } from '@/lib/utils';

const categories = ['Todos', 'Antojitos', 'Bebidas', 'Snacks', 'Combos', 'Postres'];

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="sticky top-14 lg:top-0 z-20 -mx-4 px-4 lg:mx-0 lg:px-0 py-3 bg-background/95 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => onChange(cat)}
            className={cn('shrink-0 px-4 py-2 rounded-pill text-[13px] font-600 whitespace-nowrap transition-colors',
              active === cat ? 'bg-brand text-white' : 'bg-white text-ink border border-hair hover:border-brand/40')}>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}