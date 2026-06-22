import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { reviewSubmitApi } from '../../api/client';
import Rating from '../ui/Rating';

// Customer-facing review submission form.
// Newly submitted reviews are saved to the database as 'pending' and appear
// on the storefront once an admin approves them.
export default function ReviewForm({ productId }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ userName: '', userEmail: '', rating: 5, title: '', comment: '' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.userName.trim())  return toast.error('Please enter your name');
    if (!form.comment.trim())   return toast.error('Please write your review');
    if (form.comment.length < 10) return toast.error('Review should be at least 10 characters');
    setSubmitting(true);
    try {
      await reviewSubmitApi({ ...form, productId });
      toast.success('Thank you! Your review will appear after moderation.');
      setForm({ userName: '', userEmail: '', rating: 5, title: '', comment: '' });
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-ink-100 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 text-left"
      >
        <div>
          <div className="font-bold text-brand-700">Write a review</div>
          <div className="text-xs text-ink-500">Share your experience with other customers</div>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Your rating *</div>
            <Rating
              interactive
              value={form.rating}
              onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm block">
              <div className="font-semibold mb-1">Name *</div>
              <input className="input" value={form.userName} onChange={set('userName')} placeholder="e.g. Ayesha K." />
            </label>
            <label className="text-sm block">
              <div className="font-semibold mb-1">Email (optional)</div>
              <input className="input" type="email" value={form.userEmail} onChange={set('userEmail')} placeholder="kept private" />
            </label>
          </div>

          <label className="text-sm block">
            <div className="font-semibold mb-1">Review title</div>
            <input className="input" value={form.title} onChange={set('title')} placeholder="Summarize in a few words" maxLength={80} />
          </label>

          <label className="text-sm block">
            <div className="font-semibold mb-1">Your review *</div>
            <textarea
              rows={4}
              className="input"
              value={form.comment}
              onChange={set('comment')}
              placeholder="What did you like or dislike? Was the quality as expected?"
              maxLength={1000}
            />
            <div className="text-[11px] text-ink-500 mt-1 text-right">{form.comment.length} / 1000</div>
          </label>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary"><Send size={14} /> {submitting ? 'Submitting…' : 'Submit Review'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
