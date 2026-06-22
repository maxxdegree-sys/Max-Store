/** Lower displayRank = shown first; unranked products follow, then by sold. */
export function sortProductsForDisplay(products = []) {
  return [...products].sort((a, b) => {
    const ra = a.displayRank ?? Number.MAX_SAFE_INTEGER;
    const rb = b.displayRank ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    const sa = Number(a.sold) || 0;
    const sb = Number(b.sold) || 0;
    if (sa !== sb) return sb - sa;
    return String(b.id).localeCompare(String(a.id));
  });
}

export function productsByTag(items, tag, { limit } = {}) {
  const list = sortProductsForDisplay(items.filter((p) => p.tags?.includes(tag)));
  return limit ? list.slice(0, limit) : list;
}

export function topBySold(items, limit = 8) {
  return [...items]
    .sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0))
    .slice(0, limit);
}
