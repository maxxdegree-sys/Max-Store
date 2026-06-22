import { useState } from 'react';
import { Star } from 'lucide-react';
import { stars } from '../../utils/format';

// Display + interactive star rating.
// Pass `interactive` + `onChange` to let user pick 1-5.
export default function Rating({
  value = 0,
  count,
  size = 14,
  interactive = false,
  onChange,
  className = ''
}) {
  const [hover, setHover] = useState(0);

  if (interactive) {
    return (
      <div className={`inline-flex items-center gap-0.5 ${className}`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= (hover || value);
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange?.(n)}
              className={`p-0.5 rounded transition-transform hover:scale-110 ${filled ? 'text-amber-400' : 'text-ink-300'}`}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star size={size + 6} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    );
  }

  const { full, half, empty } = stars(value);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex text-amber-400">
        {Array.from({ length: full }).map((_, i)  => <Star key={`f${i}`} size={size} fill="currentColor" strokeWidth={1.5} />)}
        {half && <Star size={size} fill="currentColor" strokeWidth={1.5} className="opacity-60" />}
        {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} size={size} className="text-ink-300" strokeWidth={1.5} />)}
      </div>
      {count != null && <span className="text-xs text-ink-500">({count})</span>}
    </div>
  );
}
