import { query, queryOne } from './db/pg.js';

export function computeDiscount(row, orderTotal) {
  const sub = Number(orderTotal) || 0;
  const pct = Number(row.percent) || 0;
  const fixed = Number(row.fixed_amount) || 0;
  if (pct > 0) return Math.round((sub * pct) / 100);
  if (fixed > 0) return Math.min(fixed, sub);
  return 0;
}

export async function validateCoupon(code, orderTotal) {
  const trimmed = String(code || '').trim();
  if (!trimmed) return null;

  const row = await queryOne(
    `SELECT * FROM coupons WHERE upper(code) = upper($1) AND active = true`,
    [trimmed]
  );
  if (!row) {
    const err = new Error('Invalid or expired coupon');
    err.status = 404;
    throw err;
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    const err = new Error('This coupon has expired');
    err.status = 400;
    throw err;
  }
  if (row.max_uses != null && row.uses >= row.max_uses) {
    const err = new Error('Coupon usage limit reached');
    err.status = 400;
    throw err;
  }
  const sub = Number(orderTotal) || 0;
  if (row.min_order && sub < Number(row.min_order)) {
    const err = new Error(`Minimum order of PKR ${row.min_order} required`);
    err.status = 400;
    throw err;
  }

  return {
    id: row.id,
    code: row.code,
    percent: Number(row.percent) || 0,
    fixedAmount: Number(row.fixed_amount) || 0,
    description: row.description || '',
    discount: computeDiscount(row, sub)
  };
}

export async function incrementCouponUse(couponId) {
  if (!couponId) return;
  await query('UPDATE coupons SET uses = uses + 1 WHERE id = $1', [couponId]);
}
