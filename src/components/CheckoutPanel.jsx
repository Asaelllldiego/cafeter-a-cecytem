import React, { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';
import { Trash2, Minus, Plus, Clock, Loader2, CheckCircle2, Tag, Clock4, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isWithinSchedule, nextOpeningInstant, SCHEDULE_TEXT } from '@/components/ScheduleBadge';
import { useTeacherArea } from '@/lib/TeacherAreaContext';

const pickupOptions = ['Receso 1', 'Receso 2', 'Personalizado'];

export default function CheckoutPanel({ onDone, mobile, customerName: nameProp, onCustomerNameChange, notes: notesProp, onNotesChange }) {
  const { items, removeItem, updateQuantity, clearCart, subtotal, tax, total, itemCount,
    pickupTime, setPickupTime } = useCart();
  const { session } = useTeacherArea();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [customTime, setCustomTime] = useState('');
  // Nombre y notas: estado local del panel (cada tecla solo re-renderiza
  // este formulario, no toda la página). La hoja móvil los pasa como
  // props para que no se pierdan al cerrar y reabrir el carrito.
  const [localName, setLocalName] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const customerName = nameProp !== undefined ? nameProp : localName;
  const setCustomerName = onCustomerNameChange || setLocalName;
  const notes = notesProp !== undefined ? notesProp : localNotes;
  const setNotes = onNotesChange || setLocalNotes;

  const open = isWithinSchedule();
  // Fuera de horario: el pedido se programa para la próxima apertura (7:00 AM).
  const nextOpen = open ? null : nextOpeningInstant();
  const nextOpenLabel = nextOpen ? `${nextOpen.toLocaleDateString('es-MX', { weekday: 'long' })} 7:00 AM` : '';

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const finalPickup = pickupTime === 'Personalizado' ? customTime : pickupTime;
      // Totals/price are recomputed server-side; send only ids + quantities.
      // Si hay sesión de Área de Maestros activa, se envía el token para que el
      // servidor marque el pedido como de profesor (verificado, no confiado).
      const payload = {
        items: items.map(i => ({ id: i.id, quantity: i.quantity })),
        pickup_time: finalPickup,
        customer_name: customerName || 'Estudiante',
        notes,
      };
      if (!open) {
        // Programar: la fecha objetivo se calcula en el cliente (su zona
        // horaria) y el servidor solo acepta fechas válidas y futuras.
        payload.scheduled_for = nextOpeningInstant().toISOString();
      }
      if (session) {
        payload.teacher_token = session.token;
        payload.teacher_version = session.version;
      }
      const res = await base44.functions.invoke('createOrder', payload);
      const d = res?.data || {};
      if (!d.ok) {
        throw new Error(d.error || 'order_failed');
      }
      setScheduledAt(payload.scheduled_for ? new Date(payload.scheduled_for) : null);
      setSuccess(true);
      clearCart();
      setNotes('');
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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-brand-light mb-4">
          <CheckCircle2 className="w-9 h-9 text-brand" />
        </div>
        <h3 className="font-display font-700 text-[20px] text-foreground">{scheduledAt ? '¡Pedido programado!' : '¡Pedido confirmado!'}</h3>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          {scheduledAt
            ? `Lo prepararemos el ${scheduledAt.toLocaleDateString('es-MX', { weekday: 'long' })} 7:00 AM · Recoger en ${pickupTime === 'Personalizado' ? customTime : pickupTime}`
            : `Recíbelo en ${pickupTime === 'Personalizado' ? customTime : pickupTime}`}
        </p>
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
          <p className="text-[12px] text-amber-800 leading-relaxed">Estamos fuera de horario ({SCHEDULE_TEXT}). Puedes programar tu pedido y lo prepararemos en el próximo horario.</p>
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

          <button onClick={handleConfirm} disabled={loading}
            className="w-full py-3.5 rounded-pill bg-brand text-white font-display font-700 text-[15px] hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {open ? 'Confirmando...' : 'Programando...'}</>
              : <>{open ? <Tag className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />} {open ? 'Confirmar Pedido' : 'Programar pedido'}</>}
          </button>
          {!open && <p className="text-center text-[11px] text-muted-foreground">Se preparará el {nextOpenLabel}</p>}
        </div>
      )}
    </div>
  );
}