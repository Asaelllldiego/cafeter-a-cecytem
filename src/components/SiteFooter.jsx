import React from 'react';
import { UtensilsCrossed, Clock, CreditCard, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SCHEDULE_TEXT } from '@/components/ScheduleBadge';

const WHATSAPP_NUMBER = '5210000000000'; //_actualiza_con_tu_número
const WHATSAPP_TEXT = encodeURIComponent('¡Hola! Quiero hacer un pedido en la Cafetería CECYTEM 🐯');

export default function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-hair bg-card">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="grid place-items-center w-8 h-8 rounded-xl bg-brand text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <p className="font-display font-700 text-[15px] text-foreground">CECYTEM</p>
            </div>
            <p className="text-[12px] text-mutedink leading-relaxed">Cooperativa escolar. Comida, bebidas y artículos de higiene para la comunidad estudiantil.</p>
          </div>

          <div>
            <p className="text-[11px] font-600 uppercase tracking-wide text-mutedink mb-2">Información</p>
            <ul className="space-y-1.5 text-[12px] text-foreground">
              <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-brand" /> {SCHEDULE_TEXT}</li>
              <li className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-brand" /> Efectivo y tarjeta</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-brand" /> Plantel CECYTEM</li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-600 uppercase tracking-wide text-mutedink mb-2">Contacto</p>
            <div className="flex flex-col gap-2">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-pill bg-[#25D366] text-white text-[12px] font-600 w-fit hover:opacity-90">
                <MessageCircle className="w-4 h-4" /> Pedir por WhatsApp
              </a>
              <p className="text-[11px] text-mutedink flex items-center gap-1.5"><Phone className="w-3 h-3" /> Actualiza el número en el panel</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-mutedink mt-6 text-center">© {new Date().getFullYear()} Cafetería CECYTEM · Hecho con 🐯</p>
      </div>
    </footer>
  );
}