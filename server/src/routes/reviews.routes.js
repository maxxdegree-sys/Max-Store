import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

// Public — get approved reviews for a product
r.get('/product/:productId', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT * FROM reviews WHERE product_id = $1 AND status = 'approved' ORDER BY created_at DESC`,
      [req.params.productId]
    );
    res.json({ reviews: rows });
  } catch (e) { next(e); }
});

// Public — submit a review
r.post('/submit', async (req, res, next) => {
  try {
    const d = req.body || {};
    if (!d.productId || !d.comment) return res.status(400).json({ error: 'Product and comment are required' });
    const id = 'r' + Date.now();
    await query(
      `INSERT INTO reviews (id,product_id,user_name,user_email,rating,title,comment,date,status,helpful,verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,'pending',0,false)`,
      [id, d.productId, d.userName||'Anonymous', d.userEmail||'', Math.max(1,Math.min(5,d.rating||5)), d.title||'', d.comment]
    );
    res.json({ ok: true, id });
  } catch (e) { next(e); }
});

// Admin — list all reviews
r.get('/', requireAuth, requirePermission('reviews'), async (req, res, next) => {
  try {
    const { status, productId } = req.query;
    let sql = 'SELECT * FROM reviews WHERE 1=1';
    const vals = []; let i = 1;
    if (status)    { sql += ` AND status = $${i++}`;     vals.push(status); }
    if (productId) { sql += ` AND product_id = $${i++}`; vals.push(productId); }
    sql += ' ORDER BY created_at DESC';
    res.json({ reviews: await query(sql, vals) });
  } catch (e) { next(e); }
});

r.patch('/:id', requireAuth, requirePermission('reviews'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id, status FROM reviews WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Review not found' });
    const { status, verified } = req.body || {};
    const sets = []; const vals = []; let i = 1;
    if (status   !== undefined) { sets.push(`status = $${i++}`);   vals.push(status); }
    if (verified !== undefined) { sets.push(`verified = $${i++}`); vals.push(!!verified); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    await query(`UPDATE reviews SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    logAudit(req, { action: 'review.update', entity: 'review', entityId: req.params.id, before: { status: row.status }, after: { status }, note: 'Updated review' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('reviews'), async (req, res, next) => {
  try {
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'review.delete', entity: 'review', entityId: req.params.id, note: 'Deleted review' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Bulk delete by status (admin convenience)
r.delete('/bulk/:status', requireAuth, requirePermission('reviews'), async (req, res, next) => {
  try {
    const { rowCount } = await queryOne(`DELETE FROM reviews WHERE status = $1 RETURNING id`, [req.params.status]).catch(() => ({ rowCount: 0 }));
    await query('DELETE FROM reviews WHERE status = $1', [req.params.status]);
    logAudit(req, { action: 'review.bulkDelete', entity: 'review', note: `Bulk deleted reviews with status: ${req.params.status}` });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Admin — bulk import
r.post('/bulk', requireAuth, requirePermission('reviews'), async (req, res, next) => {
  try {
    const { rows = [], defaultStatus = 'approved' } = req.body || {};
    const valid = rows.filter((r) => r && r.productId && r.comment && r.rating);
    for (let i = 0; i < valid.length; i++) {
      const rv = valid[i];
      await query(
        `INSERT INTO reviews (id,product_id,user_name,user_email,rating,title,comment,date,status,helpful,verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        ['r' + (Date.now() + i), String(rv.productId).trim(), (rv.userName||'Customer').trim(), (rv.userEmail||'').trim(),
         Math.max(1,Math.min(5,parseInt(rv.rating,10)||5)), (rv.title||'').trim(), String(rv.comment).trim(),
         rv.date || new Date().toISOString().slice(0,10), rv.status||defaultStatus, parseInt(rv.helpful,10)||0, rv.verified===true||String(rv.verified).toLowerCase()==='true']
      );
    }
    logAudit(req, { action: 'review.bulkImport', entity: 'review', note: `Bulk imported ${valid.length} reviews` });
    res.json({ ok: true, count: valid.length });
  } catch (e) { next(e); }
});

export default r;
