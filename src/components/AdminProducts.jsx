import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Plus, Pencil, Search, Trash2, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import MobileSelect from '@/components/MobileSelect';

const CATEGORIES = ['Comida (diario)', 'Bebidas', 'Especiales', 'Higiene', 'Snacks', 'Postres'];

const EMPTY = {
  name: '', description: '', price: 0, category: 'Bebidas',
  image_url: '', stock: 50, prep_time: '5 min', available: true, popular: false, emoji: '', day_of_week: ''
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todas');
  const [editing, setEditing] = useState(null); // item or EMPTY (new) or null

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.MenuItem.filter({}, { sort: '-created_date', limit: 200 });
      setItems(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    (cat === 'todas' || i.category === cat) &&
    (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const save = async (data) => {
    if (data.id) {
      await base44.entities.MenuItem.update(data.id, { ...data });
    } else {
      const { id, ...rest } = data;
      await base44.entities.MenuItem.create({ ...rest });
    }
    setEditing(null);
    load();
  };

  const toggleAvailable = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    try { await base44.entities.MenuItem.update(item.id, { available: !item.available }); } catch (e) { load(); }
  };

  const updateStock = async (item, delta) => {
    const next = Math.max(0, (Number(item.stock) || 0) + delta);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: next } : i));
    try { await base44.entities.MenuItem.update(item.id, { stock: next }); } catch (e) { load(); }
  };

  const remove = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
    await base44.entities.MenuItem.delete(item.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mutedink" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..."
              className="w-full pl-9 pr-3 py-2 rounded-pill border border-hair bg-white text-[13px] focus:outline-none focus:border-brand" />
          </div>
          <button onClick={load} className="grid place-items-center w-10 h-10 rounded-full border border-hair bg-white hover:bg-muted shrink-0">
            <RefreshCw className={cn('w-[18px] h-[18px] text-ink', loading && 'animate-spin')} />
          </button>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill bg-brand text-white text-[13px] font-600 hover:bg-brand-dark">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
        {['todas', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={cn('shrink-0 px-3.5 py-1.5 rounded-pill text-[12px] font-600 transition-colors',
              cat === c ? 'bg-brand text-white' : 'bg-white border border-hair text-ink hover:border-brand/40')}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-[13px] text-mutedink py-12 text-center">No hay productos</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-hair p-3.5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-muted text-2xl shrink-0">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : (item.emoji || '🍽️')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-600 text-[14px] text-ink truncate">{item.name}</p>
                  <p className="text-[11px] text-mutedink">{item.category}</p>
                  <p className="font-display font-700 text-[15px] text-brand mt-0.5">${(item.price || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[10px] font-600 uppercase tracking-wide text-mutedink">Stock</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateStock(item, -1)} className="grid place-items-center w-6 h-6 rounded-full border border-hair hover:bg-muted">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={cn('w-8 text-center text-[13px] font-700', (Number(item.stock) || 0) === 0 && 'text-destructive')}>{item.stock ?? 0}</span>
                  <button onClick={() => updateStock(item, 1)} className="grid place-items-center w-6 h-6 rounded-full border border-hair hover:bg-muted">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => toggleAvailable(item)}
                  className={cn('px-2.5 py-1 rounded-pill text-[10px] font-700',
                    item.available ? 'bg-brand-light text-brand' : 'bg-red-100 text-red-700')}>
                  {item.available ? 'Disponible' : 'Agotado'}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(item)} className="grid place-items-center w-8 h-8 rounded-full hover:bg-muted text-ink">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(item)} className="grid place-items-center w-8 h-8 rounded-full hover:bg-red-50 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
          {editing && <ProductForm key={editing.id || 'new'} initial={editing} onCancel={() => setEditing(null)} onSave={save} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        discount: Number(form.discount) || 0,
        day_of_week: form.category === 'Comida (diario)' ? (form.day_of_week || '') : ''
      });
    } catch (e) { console.error(e); alert('No se pudo guardar'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-hair">
        <h3 className="font-display font-700 text-[17px] text-ink">{form.id ? 'Editar producto' : 'Nuevo producto'}</h3>
        <button type="button" onClick={onCancel} className="grid place-items-center w-8 h-8 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
        <Field label="Nombre *">
          <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Descripción">
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (MXN) *">
            <input type="number" step="0.01" required value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Stock">
            <input type="number" value={form.stock ?? 0} onChange={e => set('stock', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Categoría">
          <MobileSelect value={form.category} onValueChange={v => set('category', v)} className={inputCls} placeholder="Categoría"
            options={CATEGORIES.map(c => ({ value: c, label: c }))} />
        </Field>
        {form.category === 'Comida (diario)' && (
          <Field label="Día de la semana">
            <MobileSelect value={form.day_of_week || 'none'} onValueChange={v => set('day_of_week', v === 'none' ? '' : v)} className={inputCls} placeholder="Día de la semana"
              options={[{ value: 'none', label: '—' }, ...['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(d => ({ value: d, label: d }))]} />
          </Field>
        )}
        <Field label="Imagen (URL)">
          <input value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} placeholder="https://..." className={inputCls} />
        </Field>
        <Field label="Emoji / icono">
          <input value={form.emoji || ''} onChange={e => set('emoji', e.target.value)} placeholder="☕" maxLength={4} className={inputCls} />
        </Field>
        <Field label="Tiempo de preparación">
          <input value={form.prep_time || ''} onChange={e => set('prep_time', e.target.value)} className={inputCls} />
        </Field>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" checked={!!form.available} onChange={e => set('available', e.target.checked)} className="w-4 h-4 accent-brand" />
            Disponible
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" checked={!!form.popular} onChange={e => set('popular', e.target.checked)} className="w-4 h-4 accent-brand" />
            Popular
          </label>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-hair flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-pill border border-hair text-[13px] font-600 text-ink">Cancelar</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-3 rounded-pill bg-brand text-white text-[13px] font-700 hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-xl border border-hair bg-white text-[13px] focus:outline-none focus:border-brand';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-600 uppercase tracking-wide text-mutedink mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}