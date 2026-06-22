import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Search, CheckCircle2, XCircle, Clock, ExternalLink, Filter } from 'lucide-react';
import { listingRequestsAdminList, listingRequestsAdminApprove, listingRequestsAdminReject } from '../../api/client';
import { formatPKR } from '../../utils/format';

function StatusBadge({ s }) {
  const map = {
    pending:  { cls: 'bg-amber-50 text-amber-700',    icon: Clock,        label: 'Pending' },
    approved: { cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2, label: 'Approved' },
    rejected: { cls: 'bg-rose-50 text-rose-700',      icon: XCircle,       label: 'Rejected' }
  };
  const m = map[s] || map.pending;
  const Icon = m.icon;
  return <span className={'badge inline-flex items-center gap-1 ' + m.cls}><Icon size={12} /> {m.label}</span>;
}

function AdminListingRequestsInner() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('pending');
  const [open, setOpen] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason] = useState('');

  const refresh = () => listingRequestsAdminList()
    .then((d) => setRequests(d?.requests || []))
    .catch((e) => toast.error(e.message || 'Could not load requests'))
    .finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const filtered = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return ((r.product?.title || '') + ' ' + (r.vendor_name || r.vendorName || '') + ' ' + (r.product?.brand || '')).toLowerCase().includes(s);
  });

  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length
  };

  const approve = async (r) => {
    if (!confirm('Approve "' + (r.product?.title || '') + '"? This will create a live product assigned to ' + (r.vendor_name || 'vendor') + '.')) return;
    try {
      await listingRequestsAdminApprove(r.id);
      toast.success('Approved - product is now live');
      setOpen(null); refresh();
    } catch (e) { toast.error(e.message || 'Could not approve'); }
  };
  const reject = async () => {
    if (!rejectFor) return;
    try {
      await listingRequestsAdminReject(rejectFor.id, reason);
      toast.success('Rejected');
      setRejectFor(null); setReason(''); setOpen(null); refresh();
    } catch (e) { toast.error(e.message || 'Could not reject'); }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Listing Requests ({filtered.length})</h1>
          <p className="text-xs text-ink-500">Product proposals submitted by vendor companies. Approve to create a live product (assigned to that vendor).</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title / vendor..." className="input pl-9 !py-2 !text-sm w-64" />
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-ink-500" />
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={'px-3 py-1 rounded-lg text-xs font-semibold capitalize ' + (filter === f ? 'bg-brand-gradient text-white' : 'bg-ink-100 dark:bg-white/5 text-ink-700 dark:text-ink-200')}>
            {f} {f !== 'all' && counts[f] > 0 && <span className="ml-1 opacity-80">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="text-ink-500">Loading...</div> : filtered.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">No {filter} requests.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{r.product?.title || '(no title)'}</div>
                  <div className="text-xs text-ink-500">by <b className="text-ink-700 dark:text-ink-200">{r.vendor_name || r.vendorName || 'unknown vendor'}</b> &middot; {(r.product?.category || '').replace(/-/g, ' ')}</div>
                </div>
                <StatusBadge s={r.status} />
              </div>
              <div className="mt-2 text-sm text-ink-500 line-clamp-2">{r.product?.short || r.product?.description || '-'}</div>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-500 flex-wrap">
                <span>Brand: <b className="text-ink-700 dark:text-ink-200">{r.product?.brand || '-'}</b></span>
                <span>Price: <b className="text-ink-700 dark:text-ink-200">{formatPKR(r.product?.price || 0)}</b></span>
                <span>Stock: <b className="text-ink-700 dark:text-ink-200">{r.product?.stock || 0}</b></span>
                <span className="ml-auto">{(r.created_at || '').slice(0, 16).replace('T', ' ')}</span>
              </div>
              {r.notes && <div className="mt-2 text-xs text-ink-500"><b>Notes:</b> {r.notes}</div>}
              {r.reviewer_name && r.status !== 'pending' && (
                <div className="mt-2 text-xs"><span className={r.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}><b>{r.status === 'approved' ? 'Approved' : 'Rejected'} by {r.reviewer_name}</b> on {(r.reviewed_at || '').slice(0, 10)}</span></div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setOpen(r)} className="btn-outline !py-1.5 !px-3 text-xs"><ExternalLink size={12} /> Details</button>
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => approve(r)} className="btn-primary !py-1.5 !px-3 text-xs"><CheckCircle2 size={12} /> Approve</button>
                    <button onClick={() => { setRejectFor(r); setReason(''); }} className="btn-ghost !py-1.5 !px-3 text-xs text-red-600 border border-red-200"><XCircle size={12} /> Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{open.product?.title}</h3>
              <StatusBadge s={open.status} />
            </div>
            <div className="text-xs text-ink-500">Submitted by <b className="text-ink-700 dark:text-ink-200">{open.vendor_name || open.vendorName}</b> on {(open.created_at || '').slice(0, 16).replace('T', ' ')}</div>
            {open.product?.images?.[0] && <img src={open.product.images[0]} alt="" className="w-full max-h-64 object-contain rounded-xl bg-ink-50 dark:bg-white/5" />}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Brand"    value={open.product?.brand} />
              <Info label="Category" value={(open.product?.category || '').replace(/-/g, ' ')} />
              <Info label="Price"    value={formatPKR(open.product?.price || 0)} />
              <Info label="MRP"      value={formatPKR(open.product?.mrp || 0)} />
              <Info label="Stock"    value={open.product?.stock || 0} />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Short description</div>
              <div className="text-sm text-ink-500 whitespace-pre-wrap">{open.product?.short || '-'}</div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Full description</div>
              <div className="text-sm text-ink-500 whitespace-pre-wrap">{open.product?.description || '-'}</div>
            </div>
            {open.notes && <div className="text-xs text-ink-500"><b>Vendor notes:</b> {open.notes}</div>}
            {open.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t border-ink-100 dark:border-white/10">
                <button onClick={() => approve(open)} className="btn-primary flex-1"><CheckCircle2 size={14} /> Approve and publish</button>
                <button onClick={() => { setRejectFor(open); setReason(''); setOpen(null); }} className="btn-outline !text-red-600 !border-red-300 flex-1"><XCircle size={14} /> Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectFor(null)} />
          <div className="relative card p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold flex items-center gap-2"><XCircle size={16} className="text-red-600" /> Reject listing</h3>
            <p className="text-xs text-ink-500">Tell <b>{rejectFor.vendor_name}</b> why you can't list "<b>{rejectFor.product?.title}</b>".</p>
            <textarea rows={3} className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (visible to vendor)..." />
            <div className="flex gap-2">
              <button onClick={reject} className="btn-primary flex-1"><XCircle size={14} /> Confirm rejection</button>
              <button onClick={() => setRejectFor(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (<div><div className="text-xs text-ink-500 uppercase tracking-wider font-semibold">{label}</div><div className="font-bold capitalize">{value || '-'}</div></div>);
}

export default AdminListingRequestsInner;
