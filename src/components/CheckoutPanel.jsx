import React, { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';
import { Trash2, Minus, Plus, Clock, Loader2, CheckCircle2, Tag, Clock4 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWithinSchedule, SCHEDULE_TEXT } from '@/components/ScheduleBadge';

const pickupOptions = ['Receso 1', 'Receso 2', 'Personalizado'];

export default function CheckoutPanel({ onDone, mobile }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, tax, total, itemCount,
    pickupTime, setPickupTime, customerName, setCustomerName, notes, setNotes } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customTime, setCustomTime] = useState('');

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const finalPickup = pickupTime === 'Personalizado' ? customTime : pickupTime;
      // Totals/price are recomputed server-side; send only ids + quantities.
      const res = await base44.functions.invoke('createOrder', {
        items: items.map(i => ({ id: i.id, quantity: i.quantity })),
        pickup_time: finalPickup,
        customer_name: customerName || 'Estudiante',
        notes,
      });
      if (!res || !res.ok) {
        throw new Error(res?.error || 'order_failed');
      }
      setSuccess(true);
      clearCart();
      setTimeout(() => {
        setSuccess(false);
        if (onDone) onDone();
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const open = isWithinSchedule();

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-brand-light mb-4">
          <CheckCircle2 className="w-9 h-9 text-brand" />
        </div>
        <h3 className="font-display font-700 text-[20px] text-foreground">¡Pedido confirmado!</h3>
        <p className="text-[13px] text-muted-foreground mt-1.5">Recíbelo en {pickupTime === 'Personalizado' ? customTime : pickupTime}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', mobile ? 'max-h-[85vh]' : 'h-full')}>
      <div className={cn('px-5 pt-5 pb-3', mobile && 'border-b border-border')}>
        <h2 className="font-display font-700 text-[18px] text-foreground">Tu pedido</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-[13px] text-muted-foreground">Tu carrito está vacío</p>
            <p className="text-[11px] text-muted-foreground mt-1">Agrega productos del menú</p>
          </div>
        ) : items.map(i => (
          <div key={i.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
              {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-600 text-foreground truncate">{i.name}</p>
              <p className="text-[12px] text-brand font-600">${i.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateQuantity(i.id, i.quantity - 1)}
                className="grid place-items-center w-11 h-11 rounded-full border border-border hover:bg-muted">
                {i.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
              <span className="w-5 text-center text-[13px] font-700">{i.quantity}</span>
              <button onClick={() => updateQuantity(i.id, i.quantity + 1)}
                className="grid place-items-center w-11 h-11 rounded-full border border-border hover:bg-muted">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && !open && (
        <div className="mx-5 mt-3 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
          <Clock4 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-800 leading-relaxed">Estamos fuera de horario. Nuestro horario de atención es de {SCHEDULE_TEXT}.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="px-5 py-4 border-t border-border space-y-3.5">
          <div>
            <label className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground mb-1.5 block">Tu nombre</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej. Ana López"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-[13px] focus:outline-none focus:border-brand" />
          </div>

          <div>
            <label className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground mb-1.5 block flex items-center gap-1"><Clock className="w-3 h-3" />Recoger en</label>
            <div className="flex gap-1.5">
              {pickupOptions.map(opt => (
                <button key={opt} onClick={() => setPickupTime(opt)}
                  className={cn('flex-1 px-2 py-2 rounded-xl text-[11px] font-600 transition-colors',
                    pickupTime === opt ? 'bg-brand text-white' : 'bg-card border border-border text-foreground')}>
                  {opt === 'Personalizado' ? 'Otro' : opt}
                </button>
              ))}
            </div>
            {pickupTime === 'Personalizado' && (
              <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-border bg-card text-[13px] focus:outline-none focus:border-brand" />
            )}
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (sin cebolla, extra salsa...)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-[13px] resize-none focus:outline-none focus:border-brand" rows={2} />

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span>IVA (16%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-border">
              <span className="font-display font-700 text-[16px] text-foreground">Total</span>
              <span className="font-display font-700 text-[20px] text-brand">${total.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleConfirm} disabled={loading || !open}
            className="w-full py-3.5 rounded-pill bg-brand text-white font-display font-700 text-[15px] hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirmando...</> : <><Tag className="w-4 h-4" /> {open ? 'Confirmar Pedido' : 'Fuera de horario'}</>}
          </button>
          {!open && <p className="text-center text-[11px] text-muted-foreground">Reanudamos ventas a las 7:00 AM</p>}
        </div>
      )}
    </div>
  );
}