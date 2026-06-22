import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';
import { validateCoupon } from '../coupon.js';

const r = Router();

// Public — validate a coupon code
r.post('/validate', async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });
    const result = await validateCoupon(code, orderTotal);
    res.json({
      coupon: {
        code: result.code,
        percent: result.percent,
        fixedAmount: result.fixedAmount,
        discount: result.discount,
        description: result.description
      }
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});

r.get('/', requireAuth, requirePermission('coupons'), async (_req, res, next) => {
  try {
    res.json({ coupons: await query('SELECT * FROM coupons ORDER BY created_at DESC') });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('coupons'), async (req, res, next) => {
  try {
    const d = req.body?.coupon || req.body || {};
    if (!d.code) return res.status(400).json({ error: 'Coupon code is required' });
    const exists = await queryOne('SELECT id FROM coupons WHERE upper(code) = upper($1)', [d.code]);
    if (exists) return res.status(409).json({ error: 'Coupon code already exists' });
    const id = 'c-' + Date.now();
    await query(
      `INSERT INTO coupons (id,code,percent,fixed_amount,min_order,max_uses,expires_at,active,description)
       VALUES ($1,upper($2),$3,$4,$5,$6,$7,$8,$9)`,
      [id, d.code, Number(d.percent)||0, Number(d.fixedAmount)||0, Number(d.minOrder)||0, d.maxUses||null, d.expiresAt||null, d.active!==false, d.description||'']
    );
    const saved = await queryOne('SELECT * FROM coupons WHERE id = $1', [id]);
    logAudit(req, { action: 'coupon.create', entity: 'coupon', entityId: id, note: 'Created coupon: ' + d.code });
    res.json({ coupon: saved });
  } catch (e) { next(e); }
});

r.put('/:id', requireAuth, requirePermission('coupons'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id FROM coupons WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Coupon not found' });
    const d = req.body?.coupon || req.body || {};
    const sets = []; const vals = []; let i = 1;
    if (d.code        !== undefined) { sets.push(`code = upper($${i++})`);     vals.push(d.code); }
    if (d.percent     !== undefined) { sets.push(`percent = $${i++}`);          vals.push(Number(d.percent)); }
    if (d.fixedAmount !== undefined) { sets.push(`fixed_amount = $${i++}`);     vals.push(Number(d.fixedAmount)); }
    if (d.minOrder    !== undefined) { sets.push(`min_order = $${i++}`);        vals.push(Number(d.minOrder)); }
    if (d.maxUses     !== undefined) { sets.push(`max_uses = $${i++}`);         vals.push(d.maxUses); }
    if (d.expiresAt   !== undefined) { sets.push(`expires_at = $${i++}`);       vals.push(d.expiresAt||null); }
    if (d.active      !== undefined) { sets.push(`active = $${i++}`);           vals.push(!!d.active); }
    if (d.description !== undefined) { sets.push(`description = $${i++}`);      vals.push(d.description); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    const updated = await queryOne(`UPDATE coupons SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    logAudit(req, { action: 'coupon.update', entity: 'coupon', entityId: req.params.id, note: 'Updated coupon' });
    res.json({ coupon: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('coupons'), async (req, res, next) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'coupon.delete', entity: 'coupon', entityId: req.params.id, note: 'Deleted coupon' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
