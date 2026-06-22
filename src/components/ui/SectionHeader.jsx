import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({ eyebrow, title, subtitle, viewAll }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 sm:mb-8">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500 max-w-xl">{subtitle}</p>}
      </div>
      {viewAll && (
        <Link to={viewAll} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          View All <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
