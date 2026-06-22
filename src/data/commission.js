// Mirror of server commission slabs for UI display (per Changings.txt).

export const COMMISSION_SLABS = [
  { slab: 1, min: 1, max: 499, rate: 10.0, label: 'Up to Rs. 499', example: { price: 300, commission: 30, seller: 270 } },
  { slab: 2, min: 500, max: 999, rate: 9.0, label: 'Rs. 500 – 999', example: { price: 750, commission: 68, seller: 682 } },
  { slab: 3, min: 1000, max: 4999, rate: 8.0, label: 'Rs. 1,000 – 4,999', example: { price: 2500, commission: 200, seller: 2300 } },
  { slab: 4, min: 5000, max: 9999, rate: 7.0, label: 'Rs. 5,000 – 9,999', example: { price: 7500, commission: 525, seller: 6975 } },
  { slab: 5, min: 10000, max: 49999, rate: 6.0, label: 'Rs. 10,000 – 49,999', example: { price: 25000, commission: 1500, seller: 23500 } },
  { slab: 6, min: 50000, max: 99999, rate: 5.0, label: 'Rs. 50,000 – 99,999', example: { price: 75000, commission: 3750, seller: 71250 } },
  { slab: 7, min: 100000, max: null, rate: 2.0, label: 'Rs. 100,000+', example: { price: 150000, commission: 3000, seller: 147000 } }
];

export function slabForPrice(price) {
  const p = Math.max(0, Number(price) || 0);
  return COMMISSION_SLABS.find((s) => p >= s.min && (s.max == null || p <= s.max)) || COMMISSION_SLABS[COMMISSION_SLABS.length - 1];
}

export function calculateCommission(unitPrice) {
  const price = Math.max(0, Number(unitPrice) || 0);
  const slab = slabForPrice(price);
  const commission = Math.round(price * slab.rate) / 100;
  return { slab, rate: slab.rate, commission, sellerReceives: price - commission };
}
