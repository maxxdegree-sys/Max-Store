import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X, UploadCloud, Loader2, Link2 } from 'lucide-react';
import {
  bannersListApi, bannerCreateApi, bannerUpdateApi, bannerDeleteApi, uploadImages
} from '../../api/client';

const EMPTY = {
  type: 'promo', title: '', eyebrow: '', subtitle: '', cta: 'Explore',
  href: '/shop', image: '', badge: '', color: 'from-brand-500 to-brand-700',
  sortOrder: 0, active: true
};

// Gradient presets for promo cards (Tailwind classes used by PromoBanners / HeroSlider).
const COLOR_PRESETS = [
  { label: 'Brand Red', value: 'from-brand-500 to-brand-700' },
  { label: 'Crimson',   value: 'from-rose-500 to-red-700' },
  { label: 'Pink',      value: 'from-pink-500 to-fuchsia-600' },
  { label: 'Amber',     value: 'from-amber-500 to-orange-600' },
  { label: 'Emerald',   value: 'from-emerald-500 to-teal-600' },
  { label: 'Indigo',    value: 'from-indigo-500 to-violet-600' },
  { label: 'Slate',     value: 'from-slate-600 to-slate-800' }
];

// DB rows come back snake_case; the form/API use camelCase sortOrder.
const toForm = (b) => ({ ...EMPTY, ...b, sortOrder: b.sort_order ?? b.sortOrder ?? 0 });

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    bannersListApi()
      .then((data) => setList(data.banners || []))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await bannerDeleteApi(id);
      setList((l) => l.filter((b) => b.id !== id));
      toast.success('Banner removed');
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  const toggleActive = async (b) => {
    try {
      const next = b.active === false ? true : false;
      const r = await bannerUpdateApi(b.id, { active: next });
      setList((l) => l.map((x) => (x.id === b.id ? (r.banner || { ...x, active: next }) : x)));
    } catch {
      toast.error('Could not update banner');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title?.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        type: editing.type, title: editing.title.trim(), eyebrow: editing.eyebrow,
        subtitle: editing.subtitle, cta: editing.cta, href: editing.href,
        image: editing.image, badge: editing.badge, color: editing.color,
        sortOrder: Number(editing.sortOrder) || 0, active: editing.active !== false
      };
      if (editing.id) {
        const r = await bannerUpdateApi(editing.id, payload);
        setList((l) => l.map((x) => (x.id === editing.id ? (r.banner || { ...x, ...payload }) : x)));
        toast.success('Banner updated');
      } else {
        const r = await bannerCreateApi(payload);
        if (r.banner) setList((l) => [...l, r.banner]); else load();
        toast.success('Banner created');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Could not save banner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Banner Manager</h1>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary !py-2 text-sm"><Plus size={14} /> New Banner</button>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-ink-500 text-sm">Loading banners…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.length === 0 && (
            <div className="col-span-3 card p-10 text-center text-ink-500 text-sm">No banners yet. Click “New Banner” to add one.</div>
          )}
          {list.map((b) => (
            <div key={b.id} className="card overflow-hidden group">
              <div className={`relative aspect-[16/9] bg-gradient-to-br ${b.color || 'from-brand-600 to-brand-800'}`}>
                {b.image && <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />}
                {b.badge && <span className="absolute top-3 left-3 badge bg-white/90 text-ink-900">{b.badge}</span>}
                {b.active === false && <span className="absolute top-3 right-3 badge bg-ink-900/80 text-white">Hidden</span>}
              </div>
              <div className="p-4">
                {b.eyebrow && <div className="text-[11px] uppercase tracking-wider text-brand-700 font-bold">{b.eyebrow}</div>}
                <div className="font-bold mt-1 line-clamp-1">{b.title}</div>
                {b.subtitle && <p className="text-xs text-ink-500 line-clamp-2 mt-1">{b.subtitle}</p>}
                <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                  <span className="badge bg-ink-100 dark:bg-white/10 capitalize">{b.type || 'hero'}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(b)} className="btn-ghost !p-2 text-xs" title={b.active === false ? 'Show on site' : 'Hide from site'}>
                      {b.active === false ? 'Show' : 'Hide'}
                    </button>
                    <button className="btn-ghost !p-2" onClick={() => setEditing(toForm(b))}><Edit3 size={14} /></button>
                    <button onClick={() => remove(b.id)} className="btn-ghost !p-2 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing.id ? 'Edit Banner' : 'New Banner'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !p-2"><X /></button>
            </div>

            <BannerPreview b={editing} />

            <label className="text-sm block">
              <div className="font-semibold mb-1">Placement</div>
              <select className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                <option value="promo">Promo card (homepage promo row)</option>
                <option value="hero">Hero slide (top carousel)</option>
              </select>
            </label>

            <Field label="Title *" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field label="Eyebrow (small text above title)" value={editing.eyebrow} onChange={(v) => setEditing({ ...editing, eyebrow: v })} />
            <Field label="Subtitle" value={editing.subtitle} onChange={(v) => setEditing({ ...editing, subtitle: v })} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Button text" value={editing.cta} onChange={(v) => setEditing({ ...editing, cta: v })} />
              <Field label="Link (href)" value={editing.href} onChange={(v) => setEditing({ ...editing, href: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Badge (e.g. NEW, 50% OFF)" value={editing.badge} onChange={(v) => setEditing({ ...editing, badge: v })} />
              <label className="text-sm block">
                <div className="font-semibold mb-1">Background color</div>
                <select className="input" value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })}>
                  {COLOR_PRESETS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </div>

            <BannerImageField value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} />

            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Sort order" type="number" value={editing.sortOrder} onChange={(v) => setEditing({ ...editing, sortOrder: v })} />
              <label className="flex items-center gap-2 text-sm font-medium rounded-lg border border-ink-100 dark:border-white/10 p-3">
                <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="accent-brand-600" />
                Active (visible on site)
              </label>
            </div>

            <button disabled={saving} className="btn-primary w-full !py-3">{saving ? 'Saving…' : 'Save Banner'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function BannerPreview({ b }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 h-36 text-white bg-gradient-to-br ${b.color || 'from-brand-600 to-brand-800'}`}>
      {b.image && <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      {b.badge && <span className="absolute top-3 right-3 badge bg-white/90 text-ink-900">{b.badge}</span>}
      <div className="relative">
        {(b.eyebrow || b.subtitle) && <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">{b.subtitle || b.eyebrow}</div>}
        <div className="text-xl font-extrabold mt-1 max-w-[16ch] leading-tight">{b.title || 'Banner title'}</div>
        {b.cta && <span className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{b.cta} →</span>}
      </div>
    </div>
  );
}

function BannerImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadImages([file], {});
      const ok = (res.images || []).find((i) => !i.error);
      if (ok) { onChange(ok.url); toast.success('Image uploaded'); }
      else toast.error(res.images?.[0]?.error || 'Upload failed');
    } catch (err) {
      toast.error(err.message?.includes('401') ? 'Sign in to the backend to upload' : (err.message || 'Upload failed'));
    } finally { setBusy(false); }
  };

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    if (!/^https?:\/\//.test(u) && !u.startsWith('/api/media/')) return toast.error('Enter a valid image URL');
    onChange(u); setUrl('');
  };

  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">Background image (optional)</div>
      {value && (
        <div className="relative rounded-lg overflow-hidden ring-1 ring-ink-200 dark:ring-white/10">
          <img src={value} alt="" className="w-full h-28 object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-2 right-2 p-1.5 rounded bg-white/90 text-rose-600"><Trash2 size={14} /></button>
        </div>
      )}
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" hidden onChange={pick} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-outline !py-2 !px-3 text-sm flex-1 justify-center">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} {busy ? 'Uploading…' : 'Upload image'}
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="input pl-9 !py-2 !text-sm" />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline !py-2 !px-3 text-sm">Add</button>
      </div>
    </div>
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
