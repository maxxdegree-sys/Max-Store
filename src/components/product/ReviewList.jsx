import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThumbsUp, BadgeCheck, MessageSquare } from 'lucide-react';
import {
  selectApprovedReviews, selectHelpfulVoted, markHelpful
} from '../../store/reviewsSlice';
import Rating from '../ui/Rating';

const SORTS = [
  { v: 'recent',  l: 'Most Recent' },
  { v: 'helpful', l: 'Most Helpful' },
  { v: 'high',    l: 'Highest Rating' },
  { v: 'low',     l: 'Lowest Rating' }
];

// Public list of approved reviews for a product.
export default function ReviewList({ productId }) {
  const reviews = useSelector(selectApprovedReviews(productId));
  const voted = useSelector(selectHelpfulVoted);
  const dispatch = useDispatch();
  const [sort, setSort] = useState('recent');
  const [filter, setFilter] = useState(0); // 0 = all, else star count

  const sorted = useMemo(() => {
    let list = [...reviews];
    if (filter) list = list.filter((r) => r.rating === filter);
    switch (sort) {
      case 'helpful': list.sort((a, b) => b.helpful - a.helpful); break;
      case 'high':    list.sort((a, b) => b.rating - a.rating); break;
      case 'low':     list.sort((a, b) => a.rating - b.rating); break;
      default:        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    }
    return list;
  }, [reviews, sort, filter]);

  if (!reviews.length) {
    return (
      <div className="text-center py-8 text-ink-500">
        <MessageSquare size={36} className="mx-auto opacity-40 mb-2" />
        <p className="text-sm">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 pt-4 border-t border-ink-100 dark:border-white/10">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter(0)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter === 0 ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-white/5 text-ink-700 dark:text-ink-200'}`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = reviews.filter((r) => r.rating === n).length;
            if (!count) return null;
            return (
              <button
                key={n}
                onClick={() => setFilter(n)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter === n ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-white/5 text-ink-700 dark:text-ink-200'}`}
              >
                {n} star ({count})
              </button>
            );
          })}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input !py-1.5 !px-3 text-xs w-auto"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>

      {/* Reviews */}
      <ol className="space-y-4">
        {sorted.map((r) => {
          const hasVoted = voted.includes(r.id);
          return (
            <li key={r.id} className="rounded-xl border border-ink-100 dark:border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-brand-gradient text-white text-xs font-bold shrink-0">
                    {String(r.userName || 'A').split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{r.userName}</span>
                      {r.verified && (
                        <span title="Verified buyer" className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700">
                          <BadgeCheck size={12} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <Rating value={r.rating} size={12} />
                  </div>
                </div>
                <time className="text-xs text-ink-500 shrink-0">{r.date}</time>
              </div>

              {r.title && <h4 className="font-bold text-sm mt-3">{r.title}</h4>}
              <p className="text-sm text-ink-700 dark:text-ink-200 mt-1 leading-relaxed">{r.comment}</p>

              <button
                onClick={() => dispatch(markHelpful(r.id))}
                disabled={hasVoted}
                className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 transition ${hasVoted ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-white/5 hover:bg-brand-50 hover:text-brand-700'}`}
              >
                <ThumbsUp size={12} /> Helpful ({r.helpful})
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
