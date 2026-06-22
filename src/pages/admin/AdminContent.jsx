import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Megaphone, Quote, Flame, BarChart3, LayoutGrid } from 'lucide-react';
import { siteSettingsApi, siteSettingsSaveApi } from '../../api/client';
import { setSiteSettings } from '../../store/settingsSlice';
import { STOREFRONT_TAGS } from '../../constants/storefrontTags';

const ICON_OPTIONS = ['Sparkles', 'Truck', 'Phone', 'Tag', 'Gift', 'Star', 'Percent', 'Clock'];

export default function AdminContent() {
  const dispatch = useDispatch();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteSettingsApi()
      .then((d) => setSite(d.site))
      .catch((e) => toast.error(e.message || 'Could not load content'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-500">Loading site content…</div>;
  if (!site) return <div className="text-ink-500">Could not load site content.</div>;

  const patch = (key, value) => setSite((s) => ({ ...s, [key]: value }));

  // Announcements
  const setAnn = (i, field, val) => patch('announcements', site.announcements.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  const addAnn = () => patch('announcements', [...(site.announcements || []), { icon: 'Sparkles', text: '' }]);
  const delAnn = (i) => patch('announcements', site.announcements.filter((_, idx) => idx !== i));

  // Testimonials
  const setT = (i, field, val) => patch('testimonials', site.testimonials.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  const addT = () => patch('testimonials', [...(site.testimonials || []), { id: Date.now(), name: '', city: '', rating: 5, text: '', avatar: '' }]);
  const delT = (i) => patch('testimonials', site.testimonials.filter((_, idx) => idx !== i));

  const flash = site.flashSale || {};
  const about = site.about || {};
  const homepage = { sectionLimit: 8, bestSellersMode: 'manual', sections: { featured: { enabled: true }, trending: { enabled: true }, newArrivals: { enabled: true }, bestSellers: { enabled: true } }, ...(site.homepage || {}) };
  const hpSections = homepage.sections || {};

  const patchHomepage = (patch) => patch('homepage', { ...homepage, ...patch });
  const patchHpSection = (key, field, val) => patchHomepage({
    sections: { ...hpSections, [key]: { ...hpSections[key], [field]: val } }
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const cleanAnn = (site.announcements || []).filter((a) => a.text && a.text.trim());
      const cleanT = (site.testimonials || []).filter((t) => t.text && t.text.trim());
      const payload = { ...site, announcements: cleanAnn, testimonials: cleanT };
      const data = await siteSettingsSaveApi(payload);
      dispatch(setSiteSettings(data.site));
      setSite(data.site);
      toast.success('Site content saved');
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">Site Content</h1>
          <p className="text-sm text-ink-500">Edit the storefront announcement bar, flash sale, testimonials and About stats.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving…' : 'Save changes'}</button>
      </div>

      {/* Announcement bar */}
      <section className="card p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Megaphone size={18} className="text-brand-700" /> Announcement Bar</h2>
        {(site.announcements || []).map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={a.icon || 'Sparkles'} onChange={(e) => setAnn(i, 'icon', e.target.value)} className="input !w-32 !py-2">
              {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input value={a.text || ''} onChange={(e) => setAnn(i, 'text', e.target.value)} placeholder="Message text" className="input flex-1 !py-2" />
            <button onClick={() => delAnn(i)} className="btn-ghost !p-2 text-red-600" aria-label="Remove"><Trash2 size={16} /></button>
          </div>
        ))}
        <button onClick={addAnn} className="btn-outline !py-2 text-sm"><Plus size={14} /> Add message</button>
      </section>

      {/* Flash sale */}
      <section className="card p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Flame size={18} className="text-rose-600" /> Flash Sale</h2>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={flash.enabled !== false} onChange={(e) => patch('flashSale', { ...flash, enabled: e.target.checked })} className="accent-brand-600" />
          Show the flash sale section on the home page
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm block">
            <div className="font-semibold mb-1">Heading</div>
            <input value={flash.title || ''} onChange={(e) => patch('flashSale', { ...flash, title: e.target.value })} placeholder="⚡ Flash Sale Live Now" className="input" />
          </label>
          <label className="text-sm block">
            <div className="font-semibold mb-1">Countdown ends at</div>
            <input type="datetime-local" value={flash.endsAt || ''} onChange={(e) => patch('flashSale', { ...flash, endsAt: e.target.value })} className="input" />
            <div className="text-[11px] text-ink-500 mt-1">Leave blank for a rolling 9-hour countdown. Past dates hide the section.</div>
          </label>
        </div>
      </section>

      {/* Homepage product rows */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><LayoutGrid size={18} className="text-brand-700" /> Homepage Product Rows</h2>
        <p className="text-sm text-ink-500">
          Pick which products appear in each row under <strong>Admin → Products</strong> using the section tags (Featured, Trending, etc.).
          Set <strong>Rank</strong> on each product to control order (1 = first). Flash sale products use the Flash Sale tag.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm block">
            <div className="font-semibold mb-1">Products per row</div>
            <input type="number" min={4} max={24} value={homepage.sectionLimit ?? 8} onChange={(e) => patchHomepage({ sectionLimit: Number(e.target.value) })} className="input" />
          </label>
          <label className="text-sm block">
            <div className="font-semibold mb-1">Best sellers source</div>
            <select value={homepage.bestSellersMode || 'manual'} onChange={(e) => patchHomepage({ bestSellersMode: e.target.value })} className="input">
              <option value="manual">Manual — products tagged Best Seller</option>
              <option value="auto">Automatic — top products by units sold</option>
            </select>
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { key: 'featured', label: 'Featured Products' },
            { key: 'trending', label: 'Trending Products' },
            { key: 'newArrivals', label: 'New Arrivals' },
            { key: 'bestSellers', label: 'Best Sellers' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm font-medium rounded-lg border border-ink-100 dark:border-white/10 p-3">
              <input
                type="checkbox"
                checked={hpSections[key]?.enabled !== false}
                onChange={(e) => patchHpSection(key, 'enabled', e.target.checked)}
                className="accent-brand-600"
              />
              Show {label}
            </label>
          ))}
        </div>
        <div className="text-xs text-ink-500 space-y-1">
          {STOREFRONT_TAGS.map((t) => (
            <div key={t.id}><span className="font-semibold text-ink-700 dark:text-ink-300">{t.label}</span> — {t.description}</div>
          ))}
        </div>
      </section>

      {/* About stats */}
      <section className="card p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><BarChart3 size={18} className="text-brand-700" /> About Page Stats</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm block"><div className="font-semibold mb-1">Happy Customers</div><input value={about.customers || ''} onChange={(e) => patch('about', { ...about, customers: e.target.value })} className="input" placeholder="50K+" /></label>
          <label className="text-sm block"><div className="font-semibold mb-1">Products</div><input value={about.products || ''} onChange={(e) => patch('about', { ...about, products: e.target.value })} className="input" placeholder="1.2K+" /></label>
          <label className="text-sm block"><div className="font-semibold mb-1">Avg. Rating</div><input value={about.rating || ''} onChange={(e) => patch('about', { ...about, rating: e.target.value })} className="input" placeholder="4.8" /></label>
        </div>
      </section>

      {/* Testimonials */}
      <section className="card p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Quote size={18} className="text-brand-700" /> Testimonials</h2>
        {(site.testimonials || []).map((t, i) => (
          <div key={t.id ?? i} className="rounded-xl border border-ink-100 dark:border-white/10 p-3 space-y-2">
            <div className="grid sm:grid-cols-3 gap-2">
              <input value={t.name || ''} onChange={(e) => setT(i, 'name', e.target.value)} placeholder="Name" className="input !py-2" />
              <input value={t.city || ''} onChange={(e) => setT(i, 'city', e.target.value)} placeholder="City" className="input !py-2" />
              <select value={t.rating || 5} onChange={(e) => setT(i, 'rating', Number(e.target.value))} className="input !py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
              </select>
            </div>
            <textarea value={t.text || ''} onChange={(e) => setT(i, 'text', e.target.value)} placeholder="Review text" rows={2} className="input" />
            <div className="flex items-center gap-2">
              <input value={t.avatar || ''} onChange={(e) => setT(i, 'avatar', e.target.value)} placeholder="Avatar image URL (optional)" className="input flex-1 !py-2" />
              <button onClick={() => delT(i)} className="btn-ghost !p-2 text-red-600" aria-label="Remove"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        <button onClick={addT} className="btn-outline !py-2 text-sm"><Plus size={14} /> Add testimonial</button>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  );
}
