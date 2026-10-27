import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/CartContext';
import { Loader2, ArrowLeft, Clock, Minus, Plus, ShoppingCart, Check, Flame, AlertTriangle, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    base44.entities.MenuItem.get(id)
      .then(data => {
        setItem(data);
        if (data?.category) {
          base44.entities.MenuItem.filter({ category: data.category, id: { $ne: data.id } }, { limit: 4 })
            .then(res => setRelated(res.items || []))
            .catch(() => setRelated([]));
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-brand" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="px-4 py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-mutedink mx-auto mb-3 opacity-50" />
        <p className="font-display font-700 text-[18px] text-foreground">Producto no encontrado</p>
        <Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-pill bg-brand text-white text-[13px] font-600">Volver al menú</Link>
      </div>
    );
  }

  const outOfStock = item.available === false || item.stock <= 0;
  const lowStock = !outOfStock && item.stock <= 5;
  const fallbackEmoji = item.emoji || (item.category === 'Bebidas' ? '🥤'
    : item.category === 'Especiales' ? '⭐'
    : item.category === 'Higiene' ? '🧴'
    : item.category === 'Postres' ? '🍰'
    : item.category === 'Snacks' ? '🍪'
    : '🍽️');
  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];

  const handleAdd = () => {
    if (outOfStock) return;
    for (let i = 0; i < qty; i++) addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[13px] font-600 text-mutedink hover:text-brand mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-card rounded-3xl border border-hair overflow-hidden shadow-card">
        <div className="relative aspect-[16/10] bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-6xl">{fallbackEmoji}</div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {item.popular && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-mustard text-onaccent text-[11px] font-700">
                <Flame className="w-3.5 h-3.5" /> Popular
              </span>
            )}
            {lowStock && (
              <span className="px-2.5 py-1 rounded-pill bg-destructive/10 text-destructive text-[11px] font-600">¡Solo {item.stock} disponibles!</span>
            )}
          </div>
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 grid place-items-center">
              <span className="px-4 py-2 rounded-pill bg-card text-foreground text-[14px] font-700">Agotado</span>
            </div>
          )}
        </div>

        <div className="p-5 lg:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-600 text-brand uppercase tracking-wide">{item.category}</span>
              <h1 className="font-display font-700 text-[26px] lg:text-[30px] text-foreground leading-tight mt-1">{item.name}</h1>
            </div>
          </div>

          <p className="text-[14px] text-mutedink leading-relaxed mt-3">{item.description || 'Sin descripción disponible.'}</p>

          {/* Info clave siempre visible y etiquetada: preparación y existencias */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 bg-muted rounded-2xl px-3.5 py-3">
              <Clock className="w-5 h-5 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-600 uppercase tracking-wide text-mutedink">Preparación</p>
                <p className="text-[13px] font-700 text-foreground leading-tight">{item.prep_time || '5 min'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-muted rounded-2xl px-3.5 py-3">
              <PackageCheck className="w-5 h-5 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-600 uppercase tracking-wide text-mutedink">Existencias</p>
                <p className={cn('text-[13px] font-700 leading-tight', outOfStock ? 'text-mutedink' : lowStock ? 'text-destructive' : 'text-foreground')}>
                  {outOfStock ? 'Agotado' : lowStock ? `¡Solo ${item.stock}!` : `${item.stock} disponibles`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="font-display font-700 text-[15px] text-foreground mb-2">Ingredientes</h2>
            {ingredients.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-pill bg-brand-light text-brand text-[12px] font-600">{ing}</span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-mutedink">La cooperativa no ha especificado los ingredientes de este producto.</p>
            )}
          </div>

          {item.is_combo && (
            <div className="mt-5 p-3 rounded-2xl bg-mustard-light">
              <p className="text-[12px] font-600 text-onaccent">🍿 Este producto es un combo</p>
              <p className="text-[11px] text-mutedink mt-0.5">Incluye acompañamiento y bebida según disponibilidad.</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-mutedink">Precio</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-700 text-[28px] text-brand">${item.price.toFixed(2)}</span>
                {item.discount > 0 && (
                  <span className="text-[13px] text-mutedink line-through">${(item.price * (1 + item.discount)).toFixed(2)}</span>
                )}
              </div>
            </div>

            {!outOfStock && (
              <div className="flex items-center gap-1.5 bg-muted rounded-pill p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="grid place-items-center w-11 h-11 rounded-full bg-card border border-hair hover:bg-muted-foreground/10">
                  <Minus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                </button>
                <span className="w-8 text-center font-display font-700 text-[16px] text-foreground">{qty}</span>
                <button onClick={() => setQty(q => Math.min(item.stock, q + 1))} className="grid place-items-center w-11 h-11 rounded-full bg-card border border-hair hover:bg-muted-foreground/10">
                  <Plus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          <button onClick={handleAdd} disabled={outOfStock}
            className={cn('w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-pill text-[15px] font-700 transition-all',
              outOfStock ? 'bg-muted text-mutedink cursor-not-allowed'
              : added ? 'bg-brand-dark text-white'
              : 'bg-mustard text-onaccent hover:bg-mustard-dark hover:text-white active:scale-[0.99]')}>
            {added ? <><Check className="w-5 h-5" /> Añadido al carrito</>
              : <><ShoppingCart className="w-5 h-5" /> {outOfStock ? 'No disponible' : `Añadir ${qty} · $${(item.price * qty).toFixed(2)}`}</>}
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-700 text-[18px] text-foreground mb-3">Más de {item.category}</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {related.map(r => (
              <Link key={r.id} to={`/producto/${r.id}`} className="shrink-0 w-36 bg-card rounded-2xl border border-hair p-3 hover:shadow-card transition-shadow">
                <div className="aspect-square rounded-xl bg-muted grid place-items-center text-2xl mb-2 overflow-hidden">
                  {r.image_url ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" /> : (r.emoji || '🍽️')}
                </div>
                <p className="text-[12px] font-600 text-foreground line-clamp-1">{r.name}</p>
                <p className="text-[13px] font-700 text-brand mt-0.5">${r.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}