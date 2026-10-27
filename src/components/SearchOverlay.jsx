import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, ShoppingBasket } from 'lucide-react';
import MenuCard from '@/components/MenuCard';

// Buscador de pantalla completa que abre la lupa del encabezado móvil.
// Reutiliza el catálogo real (misma caché que Inicio) y las tarjetas del menú,
// que ya muestran imagen, precio, disponibilidad y botón de agregar al carrito.
export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.filter({}, { sort: '-popular', limit: 200 }).then(r => r.items || []),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const ql = q.trim().toLowerCase();
  const searching = ql.length > 0;
  const items = data || [];
  const results = searching ? items.filter(i => i.name.toLowerCase().includes(ql)) : [];

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-slide-up-sheet">
      <div className="bg-card border-b border-hair px-4 py-3 shrink-0" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto (café, gel, gerber...)"
              enterKeyHint="search"
              className="w-full pl-9 pr-9 py-2.5 rounded-pill border border-border bg-card text-[13px] focus:outline-none focus:border-brand"
            />
            {searching && (
              <button onClick={() => setQ('')} aria-label="Limpiar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-full hover:bg-muted">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 px-3 py-2.5 min-h-[44px] rounded-pill text-[13px] font-600 text-brand hover:bg-muted">Cerrar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
        ) : !searching ? (
          <>
            <div className="text-center py-8">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-brand-light text-brand mx-auto mb-3"><ShoppingBasket className="w-7 h-7" /></div>
              <p className="font-display font-700 text-[16px] text-foreground">¿Qué se te antoja?</p>
              <p className="text-[13px] text-muted-foreground mt-1">Escribe el nombre de un producto para encontrarlo al instante</p>
            </div>
            <p className="text-[11px] font-600 uppercase tracking-wider text-mutedink mb-3">Sugerencias</p>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {items.filter(i => i.available !== false).slice(0, 4).map(item => <MenuCard key={item.id} item={item} />)}
            </div>
          </>
        ) : results.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-[14px] font-600 text-foreground">No encontramos productos con ese nombre</p>
            <p className="text-[12px] text-muted-foreground mt-1">Revisa el nombre o prueba con otro producto</p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground mb-3">{results.length} resultado(s) para “{q}”</p>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {results.map(item => <MenuCard key={item.id} item={item} />)}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}