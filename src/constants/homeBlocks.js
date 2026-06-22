/** Re-orderable homepage blocks. The Hero slider is always pinned at the top
 *  and is intentionally not in this list. `order` (saved in site.homepage)
 *  is an array of these keys controlling the on-page sequence. */
export const HOME_BLOCKS = [
  { key: 'categories',   label: 'Category Grid' },
  { key: 'featured',     label: 'Featured Products' },
  { key: 'flashSale',    label: 'Flash Sale' },
  { key: 'trending',     label: 'Trending Products' },
  { key: 'promoBanners', label: 'Promo Banners' },
  { key: 'newArrivals',  label: 'New Arrivals' },
  { key: 'bestSellers',  label: 'Best Sellers' },
  { key: 'whyChooseUs',  label: 'Why Choose Us' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'newsletter',   label: 'Newsletter' }
];

export const DEFAULT_HOME_ORDER = HOME_BLOCKS.map((b) => b.key);

/** Normalize a saved order: keep valid known keys in their saved position,
 *  then append any block the saved order is missing (e.g. newly added blocks),
 *  and drop unknown keys. Guarantees every block renders exactly once. */
export function resolveHomeOrder(saved) {
  const valid = new Set(DEFAULT_HOME_ORDER);
  const seen = new Set();
  const out = [];
  (Array.isArray(saved) ? saved : []).forEach((k) => {
    if (valid.has(k) && !seen.has(k)) { out.push(k); seen.add(k); }
  });
  DEFAULT_HOME_ORDER.forEach((k) => { if (!seen.has(k)) out.push(k); });
  return out;
}
