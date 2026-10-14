import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Image } from '@/components/ui/image';

const AGENT_NAME = 'jaguar';
const AVATAR = 'https://media.base44.com/images/public/6abf3821dac7f514f6524981/ac7b990a1_generated_image.png';
const GREETING = "¡Rawr! 🐯 Soy Jagger, el jaguar de la cafetería CECYTEM. ¿Qué se te antoja hoy? Puedo recomendarte la comida del día o ayudarte a armar tu pedido.";
const ERROR_REPLY = "Ahora no me pude conectar 🐯 Intenta de nuevo en un momento.";

export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convError, setConvError] = useState(false);
  const scrollRef = useRef(null);

  const loadConversation = useCallback(async () => {
    setLoadingConv(true);
    setConvError(false);
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      const listArr = Array.isArray(list) ? list : (list?.items || []);
      const existing = listArr[0];
      const conversation = existing || await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: 'Cafetería CECYTEM' } });
      setConv(conversation);
      setMessages(conversation.messages && conversation.messages.length ? conversation.messages : [{ role: 'assistant', content: GREETING }]);
      return base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
      });
    } catch (e) {
      setConv(null);
      setConvError(true);
      setMessages([{ role: 'assistant', content: GREETING }]);
      return () => {};
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      const u = await loadConversation();
      if (cancelled) { u?.(); return; }
      unsub = u || (() => {});
    })();
    return () => { cancelled = true; unsub(); };
  }, [open, loadConversation]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const ready = !!conv && !loadingConv;

  const send = async () => {
    const text = input.trim();
    if (!text || busy || !conv) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);
    try {
      await base44.agents.addMessage(conv, { role: 'user', content: text });
      // Subscription streams the assistant reply; as a safety net, fetch the
      // final state in case the subscription missed it.
      try {
        const fresh = await base44.agents.getConversation(conv.id);
        if (fresh?.messages) setMessages(fresh.messages);
      } catch (_) {}
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: ERROR_REPLY }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="fixed z-40 right-4 bottom-20 lg:bottom-6 grid place-items-center w-14 h-14 rounded-full bg-brand text-white shadow-float hover:bg-brand-dark active:scale-95 transition">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed z-40 right-4 bottom-36 lg:bottom-24 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] bg-card rounded-3xl border border-hair shadow-float flex flex-col overflow-hidden animate-slide-up-sheet"
          style={{ height: 'min(70vh, 560px)' }}>
          <div className="flex items-center gap-3 px-4 py-3 bg-brand text-white">
            <Image src={AVATAR} alt="Jagger" fittingType="fill" className="w-10 h-10 rounded-full bg-white/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-[15px] leading-none">Jagger 🐯</p>
              <p className="text-[11px] opacity-80 mt-0.5">Asistente de la cafetería</p>
            </div>
            <span className="flex items-center gap-1 text-[11px]"><span className="w-2 h-2 rounded-full bg-green-300" />En línea</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-background">
            {loadingConv && <div className="grid place-items-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>}
            {!loadingConv && messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed',
                    isUser ? 'bg-brand text-white rounded-br-md' : 'bg-card border border-hair text-foreground rounded-bl-md')}>
                    {!isUser && <ReactMarkdown>{m.content}</ReactMarkdown>}
                    {isUser && <p>{m.content}</p>}
                    {m.tool_calls?.map((tc, idx) => (
                      <div key={idx} className="mt-1.5 text-[10px] flex items-center gap-1 opacity-70">
                        <Loader2 className="w-3 h-3" />
                        {tc.name}...
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-card border border-hair rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] text-mutedink">Jagger está escribiendo...</div>
              </div>
            )}
            {convError && !loadingConv && (
              <div className="grid place-items-center py-4 text-center">
                <p className="text-[12px] text-mutedink mb-2">No pude cargar la conversación.</p>
                <button onClick={loadConversation} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-muted text-foreground text-[12px] font-600">
                  <RotateCw className="w-3.5 h-3.5" /> Reintentar
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-hair bg-card">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              disabled={!ready}
              placeholder={ready ? 'Pregúntame por el menú...' : 'Cargando conversación...'}
              className="flex-1 px-3.5 py-2.5 rounded-full border border-hair bg-background text-[13px] focus:outline-none focus:border-brand disabled:opacity-60" />
            <button onClick={send} disabled={busy || !input.trim() || !ready}
              className="grid place-items-center w-10 h-10 rounded-full bg-mustard text-onaccent hover:bg-mustard-dark hover:text-white disabled:opacity-50 active:scale-90 transition">
              <Send className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}