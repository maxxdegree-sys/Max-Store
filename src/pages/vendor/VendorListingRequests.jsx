import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Plus, X, Clock, CheckCircle2, XCircle, UploadCloud } from 'lucide-react';
import { vendorListingRequestsApi, vendorSubmitListingApi, vendorUploadImages } from '../../api/client';
import { formatPKR } from '../../utils/format';

const CATEGORIES = [
  { slug: 'kitchen-appliances', name: 'Kitchen Appliances' },
  { slug: 'crockery',           name: 'Crockery' },
  { slug: 'electronics',        name: 'Electronics' },
  { slug: 'home-essentials',    name: 'Home Essentials' },
  { slug: 'beauty-products',    name: 'Beauty Products' },
  { slug: 'daily-use',          name: 'Daily Use Items' },
  { slug: 'mini-appliances',    name: 'Mini Appliances' },
  { slug: 'storage-organizers', name: 'Storage & Organizers' },
  { slug: 'gift-items',         name: 'Gift Items' },
  { slug: 'imported-products',  name: 'Imported Products' }
];

const emptyForm = { title: '', brand: '', category: 'kitchen-appliances', price: '', mrp: '', stock: '', short: '', description: '', image: '' };

function StatusBadge({ s }) {
  const map = {
    pending:  { cls: 'bg-amber-50 text-amber-700',  icon: Clock,        label: 'Pending review' },
    approved: { cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2, label: 'Approved' },
    rejected: { cls: 'bg-rose-50 text-rose-700',    icon: XCircle,       label: 'Rejected' }
  };
  const m = map[s] || map.pending;
  const Icon = m.icon;
  return <span className={'badge inline-flex items-center gap-1 ' + m.cls}><Icon size={12} /> {m.label}</span>;
}

export default function VendorListingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const refresh = () => vendorListingRequestsApi().then((d) => setRequests(d?.requests || [])).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!editing.title.trim()) return toast.error('Product title is required');
    if (!editing.price)        return toast.error('Price is required');
    setBusy(true);
    try {
      const payload = {
        title: editing.title, brand: editing.brand, category: editing.category,
        price: Number(editing.price) || 0, mrp: Number(editing.mrp) || 0,
        stock: Number(editing.stock) || 0, short: editing.short, description: editing.description,
        images: editing.image ? [editing.image] : []
      };
      await vendorSubmitListingApi(payload, notes);
      toast.success('Listing request submitted for review');
      setEditing(null); setNotes(''); refresh();
    } catch (err) { toast.error(err.message || 'Could not submit'); }
    finally { setBusy(false); }
  };

  const handleImageUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !editing) return;
    setUploading(true);
    try {
      const res = await vendorUploadImages(files);
      const url = (res?.images || []).find((i) => i.url && !i.error)?.url;
      if (url) {
        setEditing((e) => ({ ...e, image: url }));
        toast.success('Image uploaded');
      } else {
        const err = (res?.images || []).find((i) => i.error);
        toast.error(err?.error || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Listing Requests ({requests.length})</h1>
          <p className="text-sm text-ink-500">Propose new products for your brand. Maxx admin reviews and approves or rejects.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary !py-2 !px-4 text-sm"><Plus size={14} /> New listing request</button>
      </header>

      {loading ? <div className="text-ink-500">Loading...</div> : requests.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">You have not submitted any listing requests yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {requests.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{r.product?.title}</div>
                  <div className="text-xs text-ink-500">{r.product?.brand || '-'} &middot; {(r.product?.category || '').replace(/-/g, ' ')}</div>
                </div>
                <StatusBadge s={r.status} />
              </div>
              <div className="mt-2 text-sm text-ink-500 line-clamp-2">{r.product?.short || r.product?.description || '-'}</div>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                <span>Price: <b className="text-ink-700 dark:text-ink-200">{formatPKR(r.product?.price || 0)}</b></span>
                <span>Stock: <b className="text-ink-700 dark:text-ink-200">{r.product?.stock || 0}</b></span>
                <span className="ml-auto">{(r.created_at || '').slice(0, 10)}</span>
              </div>
              {r.notes && <div className="mt-2 text-xs text-ink-500"><b>Your notes:</b> {r.notes}</div>}
              {r.status === 'rejected' && r.reviewed_at && (
                <div className="mt-2 text-xs text-rose-700"><b>Rejected by {r.reviewer_name || 'admin'}</b></div>
              )}
              {r.status === 'approved' && r.reviewed_at && (
                <div className="mt-2 text-xs text-emerald-700"><b>Approved by {r.reviewer_name || 'admin'}</b></div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={submit} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">New listing request</h3>
              <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(null); }} className="btn-ghost !p-2 relative z-10"><X /></button>
            </div>
            <Field label="Product title *"><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Brand"><input className="input" value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></Field>
            <Field label="Category">
              <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Price PKR *"><input className="input" type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></Field>
              <Field label="MRP PKR"><input className="input" type="number" value={editing.mrp} onChange={(e) => setEditing({ ...editing, mrp: e.target.value })} /></Field>
              <Field label="Stock"><input className="input" type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></Field>
            </div>
            <Field label="Product image">
              <div className="space-y-2">
                {editing.image && (
                  <img src={editing.image} alt="" className="w-24 h-24 rounded-lg object-cover border border-ink-100" />
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="btn-outline !py-2 text-xs"
                  >
                    <UploadCloud size={14} /> {uploading ? 'Uploading…' : 'Upload image'}
                  </button>
                  <input
                    className="input flex-1"
                    value={editing.image}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>
            </Field>
            <Field label="Short description"><textarea rows={2} className="input" value={editing.short} onChange={(e) => setEditing({ ...editing, short: e.target.value })} /></Field>
            <Field label="Full description"><textarea rows={4} className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Notes for admin (optional)"><textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the reviewer should know..." /></Field>
            <button disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Submitting...' : 'Submit for review'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (<label className="block text-sm"><div className="font-semibold mb-1">{label}</div>{children}</label>);
}
