// Platform commission slabs — flat % on full product price (per Changings.txt).

export const COMMISSION_SLABS = [
  { slab: 1, min: 1, max: 499, rate: 10.0, label: 'Up to Rs. 499' },
  { slab: 2, min: 500, max: 999, rate: 9.0, label: 'Rs. 500 – 999' },
  { slab: 3, min: 1000, max: 4999, rate: 8.0, label: 'Rs. 1,000 – 4,999' },
  { slab: 4, min: 5000, max: 9999, rate: 7.0, label: 'Rs. 5,000 – 9,999' },
  { slab: 5, min: 10000, max: 49999, rate: 6.0, label: 'Rs. 10,000 – 49,999' },
  { slab: 6, min: 50000, max: 99999, rate: 5.0, label: 'Rs. 50,000 – 99,999' },
  { slab: 7, min: 100000, max: null, rate: 2.0, label: 'Rs. 100,000 and above' }
];

export function slabForPrice(price) {
  const p = Math.max(0, Number(price) || 0);
  return COMMISSION_SLABS.find((s) => p >= s.min && (s.max == null || p <= s.max)) || COMMISSION_SLABS[COMMISSION_SLABS.length - 1];
}

/** Commission on a single unit at the given price. */
export function calculateCommission(unitPrice) {
  const price = Math.max(0, Number(unitPrice) || 0);
  const slab = slabForPrice(price);
  const commission = Math.round(price * slab.rate) / 100;
  return {
    slab: slab.slab,
    slabLabel: slab.label,
    rate: slab.rate,
    commission,
    sellerReceives: Math.round((price - commission) * 100) / 100
  };
}

/** Commission for a line item (price × qty). */
export function commissionForLineItem(unitPrice, qty = 1) {
  const q = Math.max(1, Number(qty) || 1);
  const perUnit = calculateCommission(unitPrice);
  const lineTotal = (Number(unitPrice) || 0) * q;
  const commission = Math.round(lineTotal * perUnit.rate) / 100;
  return {
    ...perUnit,
    qty: q,
    lineTotal,
    commission,
    sellerReceives: Math.round((lineTotal - commission) * 100) / 100
  };
}
