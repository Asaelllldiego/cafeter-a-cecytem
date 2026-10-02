import React from 'react';
import FaqSection from '@/components/FaqSection';
import SiteFooter from '@/components/SiteFooter';
import { HelpCircle, MessageCircle } from 'lucide-react';

const WHATSAPP = 'https://wa.me/5210000000000?text=Hola%20cafeter%C3%ADa%20CECYTEM';

export default function Faq() {
  return (
    <div className="px-4 lg:px-8 py-5 lg:py-7 max-w-3xl mx-auto">
      <h1 className="font-display font-700 text-[28px] lg:text-[32px] text-ink mb-1 flex items-center gap-2">
        <HelpCircle className="w-7 h-7 text-brand" /> Preguntas frecuentes
      </h1>
      <p className="text-[14px] text-mutedink mb-6">Todo lo que necesitas saber antes de pedir en la cafetería</p>

      <FaqSection />

      <div className="mt-8 rounded-2xl bg-brand-light border border-brand/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand text-white shrink-0">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-display font-700 text-[16px] text-ink">¿No encontraste tu respuesta?</p>
          <p className="text-[13px] text-mutedink mt-0.5">Escríbenos por WhatsApp y te ayudamos enseguida.</p>
        </div>
        <a href={WHATSAPP} target="_blank" rel="noreferrer"
          className="px-4 py-2.5 rounded-pill bg-brand text-white text-[13px] font-700 hover:bg-brand-dark whitespace-nowrap">
          Contactar
        </a>
      </div>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}