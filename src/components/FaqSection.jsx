import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: '¿Cuál es el horario de atención?',
    a: 'Atendemos de lunes a viernes, de 7:00 AM a 5:00 PM. Fuera de este horario no se pueden confirmar pedidos.',
  },
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Agrega los productos al carrito, elige el horario de recolección (Receso 1, Receso 2 o un horario personalizado) y confirma. Recoge tu pedido en el mostrador.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos efectivo y tarjeta en el mostrador. Puedes pagar al recoger tu pedido.',
  },
  {
    q: '¿Puedo programar mi pedido para el recreo?',
    a: 'Sí. Al confirmar el pedido seleccionas "Receso 1" o "Receso 2" y lo preparamos para que lo recojas a tiempo.',
  },
  {
    q: '¿Qué pasa si un producto está agotado?',
    a: 'Los productos agotados se muestran con la etiqueta "Agotado" y no se pueden agregar al carrito hasta que volvamos a tener existencias.',
  },
  {
    q: '¿Puedo dejar notas especiales?',
    a: 'Sí. En el carrito hay un campo de notas para indicar preferencias (sin cebolla, extra salsa, etc.).',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="max-w-3xl mx-auto">
      <div className="text-center mb-5">
        <h2 className="font-display font-700 text-[19px] text-foreground">Preguntas frecuentes</h2>
        <p className="text-[12px] text-mutedink mt-1">Todo lo que necesitas saber antes de pedir</p>
      </div>
      <div className="space-y-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="bg-card rounded-2xl border border-hair overflow-hidden">
              <button onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                <span className="font-display font-600 text-[14px] text-foreground">{f.q}</span>
                <ChevronDown className={cn('w-4 h-4 text-mutedink shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && <p className="px-4 pb-4 text-[13px] text-mutedink leading-relaxed">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}