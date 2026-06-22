import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="container-px py-3 text-sm text-ink-500 flex items-center gap-1 flex-wrap">
      <Link to="/" className="hover:text-brand-700 inline-flex items-center gap-1"><Home size={14} /> Home</Link>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <ChevronRight size={14} />
          {it.to ? <Link to={it.to} className="hover:text-brand-700">{it.label}</Link> : <span className="text-ink-900 dark:text-ink-100 font-medium">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
