const variants = {
  brand:   'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  danger:  'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  warn:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  info:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  dark:    'bg-ink-900 text-white',
  light:   'bg-white text-ink-900 ring-1 ring-ink-200'
};

export default function Badge({ children, variant = 'brand', className = '' }) {
  return <span className={`badge ${variants[variant]} ${className}`}>{children}</span>;
}
