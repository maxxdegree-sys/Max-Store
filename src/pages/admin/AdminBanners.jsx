import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { bannersListApi, bannerDeleteApi } from '../../api/client';

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Banner Manager</h1>
        <button onClick={() => toast('Upload modal would open here')} className="btn-primary !py-2 text-sm"><Plus size={14} /> New Banner</button>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-ink-500 text-sm">Loading banners…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.length === 0 && (
            <div className="col-span-3 card p-10 text-center text-ink-500 text-sm">No banners yet.</div>
          )}
          {list.map((b) => (
            <div key={b.id} className="card overflow-hidden group">
              <div className="relative aspect-[16/9] bg-ink-100">
                {b.image && <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />}
                {b.badge && <span className="absolute top-3 left-3 badge bg-white/90 text-ink-900">{b.badge}</span>}
              </div>
              <div className="p-4">
                {b.eyebrow && <div className="text-[11px] uppercase tracking-wider text-brand-700 font-bold">{b.eyebrow}</div>}
                <div className="font-bold mt-1 line-clamp-1">{b.title}</div>
                {b.subtitle && <p className="text-xs text-ink-500 line-clamp-2 mt-1">{b.subtitle}</p>}
                <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                  <span>{b.type || ''}</span>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost !p-2" onClick={() => toast('Edit modal coming soon')}><Edit3 size={14} /></button>
                    <button onClick={() => remove(b.id)} className="btn-ghost !p-2 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
