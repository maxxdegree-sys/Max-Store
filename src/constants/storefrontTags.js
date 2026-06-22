/** Tags that control which homepage / shop sections a product appears in. */
export const STOREFRONT_TAGS = [
  { id: 'featured',    label: 'Featured',     description: 'Homepage — Featured Products row' },
  { id: 'trending',    label: 'Trending',     description: 'Homepage — Trending Products row' },
  { id: 'new-arrival', label: 'New Arrival',  description: 'Homepage — New Arrivals row' },
  { id: 'best-seller', label: 'Best Seller',  description: 'Homepage — Best Sellers row (when manual mode is on)' },
  { id: 'flash-sale',  label: 'Flash Sale',   description: 'Homepage flash sale strip + /shop?sale=flash' }
];

export const STOREFRONT_TAG_IDS = STOREFRONT_TAGS.map((t) => t.id);
