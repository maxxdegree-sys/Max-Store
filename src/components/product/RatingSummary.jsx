import { useSelector } from 'react-redux';
import { selectRatingBreakdown, selectAvgRating } from '../../store/reviewsSlice';
import Rating from '../ui/Rating';

// Aggregated rating widget shown at the top of the reviews section.
export default function RatingSummary({ productId }) {
  const avg = useSelector(selectAvgRating(productId));
  const { buckets, total } = useSelector(selectRatingBreakdown(productId));

  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-center">
      <div className="text-center sm:text-left">
        <div className="text-5xl font-extrabold text-brand-700">{avg.toFixed(1)}</div>
        <Rating value={avg} size={16} className="justify-center sm:justify-start mt-1" />
        <div className="text-xs text-ink-500 mt-1">
          Based on {total} verified review{total === 1 ? '' : 's'}
        </div>
      </div>

      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = buckets[n] || 0;
          const pct = total ? (count / total) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-3 text-xs">
              <span className="w-6 font-semibold tabular-nums">{n} star</span>
              <div className="flex-1 h-2 rounded-full bg-ink-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-ink-500 tabular-nums text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
