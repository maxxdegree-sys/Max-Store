import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { DownloadCloud, X, Link2, Settings2, AlertTriangle, Loader2 } from 'lucide-react';
import { selectUser, selectPermissions } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { categories } from '../../data/categories';
import { api } from '../../api/client';
import ImportSettings from './ImportSettings';

// Smart product import (executive / granted users only). Pastes a public
// product URL, the backend scrapes it, and the result is shown as an editable
// draft before being added to the catalog.
export default function ImportManager({ onImported }) {
  const user = useSelector(selectUser);
  const permissions = useSelector(selectPermissions);
  const exec = isExecutive(permissions);
  const canImport = user?.canImport || exec;

  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [dups, setDups] = useState([]);

  if (!canImport) return null;

  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

  const fetchPreview = async () => {
    if (!url.trim()) return toast.error('Paste a product URL first');
    setLoading(true); setDraft(null); setDups([]);
    try {
      const data = await api('/import/preview', { method: 'POST', body: { url: url.trim() } });
      setDraft({ ...data.draft, category: data.draft.category || 'imported-products', stock: 0, mrp: data.draft.mrp || data.draft.price || 0 });
      setDups(data.duplicates || []);
      if (!data.draft.title) toast('Fetched, but few details found - please fill in manually', { icon: 'ℹ️' });
    } catch (e) {
      toast.error(e.message || 'Could not fetch that URL');
    } finally { setLoading(false); }
  };

  const commit = async () => {
    if (!draft?.title) return toast.error('Title is required');
    setSaving(true);
    try {
      const { product } = await api('/import/commit', { method: 'POST', body: { product: draft } });
      // Map backend product -> storefront product shape and add to Redux list.
      onImported?.({
        id: product.id, slug: product.slug, title: product.title,
        price: product.price, mrp: product.mrp, stock: product.stock,
        category: product.category, brand: product.brand,
        images: product.images.length ? product.images : [''],
        short: product.short, description: product.description,
        specs: product.specs || {}, rating: 4.5, reviews: 0, sold: 0,
        tags: product.tags || ['imported']
      });
      toast.success('Imported as a draft product');
      setOpen(false); setUrl(''); setDraft(null); setDups([]);
    } catch (e) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(true)} className="btn-outline !py-2 !px-4 text-sm">
          <DownloadCloud size={14} /> Import from URL
        </button>
        {exec && (
          <button onClick={() => setShowSettings(true)} title="Import settings & log" className="btn-ghost !p-2">
            <Settings2 size={16} />
          </button>
        )}
      </div>

      {showSettings && <ImportSettings onClose={() => setShowSettings(false)} />}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><DownloadCloud size={18} /> Smart Product Import</h3>
              <button onClick={() => setOpen(false)} className="btn-ghost !p-2"><X /></button>
            </div>

            <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-xs text-ink-600 dark:text-ink-300">
              Paste a public product page URL (e.g. a supplier or marketplace listing). We fetch the title, images, price and specs for you to review and edit before publishing.
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="input pl-9" />
              </div>
              <button onClick={fetchPreview} disabled={loading} className="btn-primary !px-4 disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Fetch'}
              </button>
            </div>

            {dups.length > 0 && (
              <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 text-amber-800 p-3 text-sm">
                <div className="font-semibold flex items-center gap-2"><AlertTriangle size={15} /> Possible duplicate</div>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {dups.map((d) => <li key={d.id}>{d.title} <span className="opacity-70">({d.reason})</span></li>)}
                </ul>
              </div>
            )}

            {draft && (
              <div className="space-y-3">
                {draft.images?.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {draft.images.map((src, i) => <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover ring-1 ring-ink-200" />)}
                  </div>
                )}
                <Field label="Title" value={draft.title} onChange={set('title')} />
                <Field label="Brand" value={draft.brand} onChange={set('brand')} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (PKR)" type="number" value={draft.price || 0} onChange={(v) => set('price')(+v)} />
                  <Field label="MRP (PKR)" type="number" value={draft.mrp || 0} onChange={(v) => set('mrp')(+v)} />
                  <Field label="Stock" type="number" value={draft.stock || 0} onChange={(v) => set('stock')(+v)} />
                  <label className="text-sm"><div className="font-semibold mb-1">Category</div>
                    <select className="input" value={draft.category} onChange={(e) => set('category')(e.target.value)}>
                      <option value="imported-products">Imported Products</option>
                      {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="text-sm block"><div className="font-semibold mb-1">Description</div>
                  <textarea rows={4} className="input" value={draft.description || ''} onChange={(e) => set('description')(e.target.value)} />
                </label>
                <label className="text-sm block"><div className="font-semibold mb-1">Image URLs (one per line)</div>
                  <textarea rows={3} className="input font-mono text-xs" value={(draft.images || []).join('\n')} onChange={(e) => set('images')(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
                </label>
                <button onClick={commit} disabled={saving} className="btn-primary w-full !py-3 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add to catalog (as draft)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm block">
      <div className="font-semibold mb-1">{label}</div>
      <input className="input" type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
