import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, UserPlus } from 'lucide-react';
import { reviewSubmitApi } from '../../api/client';
import { selectAllProducts } from '../../store/productsSlice';
import Rating from '../ui/Rating';

// Admin single-review add. Defaults to approved + verified.
export default function AddReviewModal({ open, onClose }) {
  const products = useSelector(selectAllProducts);
  const [form, setForm] = useState({
    productId: products[0]?.id || '',
    userName: '',
    userEmail: '',
    rating: 5,
    title: '',
    comment: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'approved',
    verified: true
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.productId) return toast.error('Pick a product');
    if (!form.userName.trim()) return toast.error('Enter reviewer name');
    if (!form.comment.trim()) return toast.error('Enter the review text');
    reviewSubmitApi(form)
      .then(() => { toast.success('Review added'); onClose(); setForm((f) => ({ ...f, userName: '', userEmail: '', title: '', comment: '', rating: 5 })); })
      .catch((err) => toast.error(err.message || 'Failed to add review'));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={submit} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} className="text-brand-700" /> Add a Review
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost !p-2"><X /></button>
        </header>

        <label className="text-sm block">
          <div className="font-semibold mb-1">Product *</div>
          <select className="input" value={form.productId} onChange={set('productId')}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm block">
            <div className="font-semibold mb-1">Reviewer name *</div>
            <input className="input" value={form.userName} onChange={set('userName')} />
          </label>
          <label className="text-sm block">
            <div className="font-semibold mb-1">Email (optional)</div>
            <input className="input" type="email" value={form.userEmail} onChange={set('userEmail')} />
          </label>
        </div>

        <div>
          <div className="text-sm font-semibold mb-1">Rating *</div>
          <Rating interactive value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
        </div>

        <label className="text-sm block">
          <div className="font-semibold mb-1">Title</div>
          <input className="input" value={form.title} onChange={set('title')} maxLength={80} />
        </label>

        <label className="text-sm block">
          <div className="font-semibold mb-1">Comment *</div>
          <textarea rows={4} className="input" value={form.comment} onChange={set('comment')} maxLength={1000} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm block">
            <div className="font-semibold mb-1">Date</div>
            <input type="date" className="input" value={form.date} onChange={set('date')} />
          </label>
          <label className="text-sm block">
            <div className="font-semibold mb-1">Status</div>
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="approved">approved (live)</option>
              <option value="pending">pending</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
            className="accent-brand-600"
          />
          Mark as verified buyer
        </label>

        <button type="submit" className="btn-primary w-full !py-3">Add Review</button>
      </form>
    </div>
  );
}
