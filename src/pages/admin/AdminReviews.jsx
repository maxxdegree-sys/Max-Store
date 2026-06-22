import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check, X, Trash2, Search, Filter, BadgeCheck, Star, MessageSquare,
  Shield, ShieldOff, Upload, UserPlus, Download, MoreVertical
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { reviewsListApi, reviewUpdateApi, reviewDeleteApi } from '../../api/client';
import { selectAllProducts } from '../../store/productsSlice';
import Rating from '../../components/ui/Rating';
import BulkReviewImport from '../../components/admin/BulkReviewImport';
import AddReviewModal from '../../components/admin/AddReviewModal';

const FILTERS = ['All', 'pending', 'approved', 'rejected'];
const statusBadge = {
  pending:  'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-brand-50 text-brand-700 ring-brand-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200'
};

export default function AdminReviews() {
  const products = useSelector(selectAllProducts);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    setLoading(true);
    reviewsListApi()
      .then((data) => setAll(data.reviews || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    let l = [...all];
    if (filter !== 'All') l = l.filter((r) => r.status === filter);
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((r) => ((r.userName || r.user_name || '') + (r.comment || '') + (r.title || '') + (r.productId || r.product_id || '')).toLowerCase().includes(s));
    }
    return l.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [all, filter, q]);

  const counts = useMemo(() => ({
    All:      all.length,
    pending:  all.filter((r) => r.status === 'pending').length,
    approved: all.filter((r) => r.status === 'approved').length,
    rejected: all.filter((r) => r.status === 'rejected').length
  }), [all]);

  const avg = useMemo(() => {
    const approved = all.filter((r) => r.status === 'approved');
    if (!approved.length) return 0;
    return approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length;
  }, [all]);

  const updateReview = async (id, patch) => {
    try {
      const data = await reviewUpdateApi(id, patch);
      setAll((prev) => prev.map((r) => r.id === id ? { ...r, ...data.review } : r));
    } catch {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this review?')) return;
    try {
      await reviewDeleteApi(id);
      setAll((prev) => prev.filter((r) => r.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const purgeRejected = async () => {
    if (!counts.rejected) return;
    if (!confirm(`Delete all ${counts.rejected} rejected review(s)?`)) return;
    const ids = all.filter((r) => r.status === 'rejected').map((r) => r.id);
    await Promise.all(ids.map((id) => reviewDeleteApi(id).catch(() => null)));
    setAll((prev) => prev.filter((r) => r.status !== 'rejected'));
    toast.success(`Purged ${ids.length} rejected review(s)`);
  };

  const exportCsv = () => {
    const cols = ['productId','userName','userEmail','rating','title','comment','date','verified','status','helpful'];
    const escape = (v) => { const s = String(v ?? ''); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s; };
    const rows = [cols.join(',')];
    all.forEach((r) => rows.push(cols.map((c) => escape(r[c])).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `al-rafiq-reviews-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Reviews ({list.length})</h1>
          <p className="text-xs text-ink-500">Moderate, add, or bulk-import customer reviews.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews..." className="input pl-9 !py-2 !text-sm w-56" />
          </div>
          <button onClick={() => setAddOpen(true)} className="btn-outline !py-2 !px-3 text-sm"><UserPlus size={14} /> Add Review</button>
          <button onClick={() => setBulkOpen(true)} className="btn-primary !py-2 !px-3 text-sm"><Upload size={14} /> Bulk Import</button>
          <div className="relative group">
            <button className="btn-ghost !p-2" title="More actions"><MoreVertical size={16} /></button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-30 min-w-[180px] card p-1 shadow-soft">
              <button onClick={exportCsv} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-ink-100 dark:hover:bg-white/5 flex items-center gap-2"><Download size={14} /> Export all to CSV</button>
              <button onClick={purgeRejected} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 flex items-center gap-2"><Trash2 size={14} /> Purge rejected</button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Pending"  value={counts.pending}  tone="amber" icon={MessageSquare} />
        <Stat label="Approved" value={counts.approved} tone="brand" icon={Check} />
        <Stat label="Rejected" value={counts.rejected} tone="rose"  icon={X} />
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">Avg Rating</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-extrabold text-brand-700">{avg.toFixed(1)}</span>
            <Rating value={avg} size={14} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Filter size={14} className="text-ink-500" />
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${filter === f ? 'bg-brand-500 text-white border-transparent' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-white/10 hover:border-brand-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500 text-sm">Loading reviews…</div>
      ) : (
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="card p-10 text-center text-ink-500"><MessageSquare size={36} className="mx-auto opacity-40 mb-2" /><p className="text-sm">No reviews match your filter.</p></div>
          ) : list.map((r) => {
            const prodId = r.productId || r.product_id;
            const prod = products.find((p) => p.id === prodId);
            const name = r.userName || r.user_name || 'Anonymous';
            return (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                    <div className="grid place-items-center w-10 h-10 rounded-full bg-brand-gradient text-white text-xs font-bold shrink-0">
                      {name.split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold">{name}</span>
                        {r.verified && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700"><BadgeCheck size={12} /> VERIFIED</span>}
                        <span className={`badge ring-1 ${statusBadge[r.status]}`}>{r.status}</span>
                      </div>
                      <div className="text-xs text-ink-500">{r.userEmail || r.user_email || 'no email'} - {r.date || (r.createdAt ? String(r.createdAt).slice(0, 10) : '')}</div>
                      <Rating value={r.rating} size={13} className="mt-1" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {r.status !== 'approved' && (
                      <button onClick={() => { updateReview(r.id, { status: 'approved' }); toast.success('Approved'); }} className="btn-primary !py-1.5 !px-3 text-xs"><Check size={14} /> Approve</button>
                    )}
                    {r.status !== 'rejected' && (
                      <button onClick={() => { updateReview(r.id, { status: 'rejected' }); toast('Rejected'); }} className="btn !py-1.5 !px-3 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"><X size={14} /> Reject</button>
                    )}
                    <button onClick={() => updateReview(r.id, { verified: !r.verified })} className="btn-ghost !p-2" title={r.verified ? 'Remove verified badge' : 'Mark as verified buyer'}>
                      {r.verified ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="btn-ghost !p-2 text-red-500" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>

                {prod && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-ink-100/40 dark:bg-white/5 p-2.5 text-xs">
                    <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="font-medium line-clamp-1 flex-1">{prod.title}</span>
                    <a href={`/product/${prod.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-700 font-semibold whitespace-nowrap">View product</a>
                  </div>
                )}

                {r.title && <h4 className="font-bold text-sm mt-3">{r.title}</h4>}
                <p className="text-sm text-ink-700 dark:text-ink-200 mt-1 leading-relaxed">{r.comment}</p>
                <div className="mt-3 text-xs text-ink-500"><Star size={11} className="inline -mt-0.5" /> {r.rating}/5 - {r.helpful || 0} helpful vote{r.helpful === 1 ? '' : 's'}</div>
              </div>
            );
          })}
        </div>
      )}

      <BulkReviewImport open={bulkOpen} onClose={() => { setBulkOpen(false); load(); }} />
      <AddReviewModal   open={addOpen}  onClose={() => { setAddOpen(false); load(); }} />
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }) {
  const palette = { amber: 'bg-amber-50 text-amber-700', brand: 'bg-brand-50 text-brand-700', rose: 'bg-rose-50 text-rose-700' };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
          <div className="text-2xl font-extrabold mt-1">{value}</div>
        </div>
        <span className={`grid place-items-center w-9 h-9 rounded-xl ${palette[tone]}`}><Icon size={16} /></span>
      </div>
    </div>
  );
}
