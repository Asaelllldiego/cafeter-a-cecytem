import React, { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { ShoppingBag, Clock } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CheckoutPanel from '@/components/CheckoutPanel';

export default function MobileCartBar() {
  const { itemCount, total, pickupTime } = useCart();
  const [open, setOpen] = useState(false);
  if (itemCount === 0) return null;
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between px-5 py-3.5 rounded-pill bg-brand text-white shadow-float active:scale-[0.98] transition-transform">
        <span className="flex items-center gap-2.5">
          <span className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-mustard text-ink text-[10px] font-700">{itemCount}</span>
          </span>
          <span className="text-[13px] font-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pickupTime}</span>
        </span>
        <span className="font-display font-700 text-[16px]">${total.toFixed(2)}</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="p-0 max-h-[85vh] overflow-hidden">
          <CheckoutPanel onDone={() => setOpen(false)} mobile />
        </SheetContent>
      </Sheet>
    </>
  );
}