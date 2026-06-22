// Pakistani Rupee formatting + helpers
export const formatPKR = (value) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value);

export const discountPercent = (mrp, price) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const slugify = (str) =>
  str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const truncate = (str, n = 80) => (str?.length > n ? str.slice(0, n - 1) + '…' : str);

/** "12 Jun 2026, 2:30 PM" — for tracking timelines. Returns '' on bad input. */
export const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(d);
};

/** "12 Jun 2026" — date only. Returns '' on bad input. */
export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};

/** Grid/card thumbnail — maps /api/media/…/id.webp → …/id_thumb.webp */
export const imageThumbUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/api/media/') || url.includes('_thumb.webp')) return url;
  if (url.endsWith('.webp')) return url.replace(/\.webp$/, '_thumb.webp');
  return url;
};

export const stars = (rating = 0) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return { full, half, empty: 5 - full - (half ? 1 : 0) };
};

// Central business contact constants — single source of truth
export const BUSINESS = {
  name:    'Maxx',
  email:   'support@maxxdegree.com',
  address: 'Near Sherreen Masjid, Main Bazar, Kharian',
  city:    'Kharian',
  region:  'Punjab',
  country: 'Pakistan',
  postal:  '50090'
};
