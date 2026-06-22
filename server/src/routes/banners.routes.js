import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

// Public — get active banners by type
r.get('/public', async (req, res, next) => {
  try {
    const { type } = req.query;
    const sql = type
      ? `SELECT * FROM banners WHERE active = true AND type = $1 ORDER BY sort_order ASC`
      : `SELECT * FROM banners WHERE active = true ORDER BY type, sort_order ASC`;
    res.json({ banners: await query(sql, type ? [type] : []) });
  } catch (e) { next(e); }
});

r.get('/', requireAuth, requirePermission('banners'), async (_req, res, next) => {
  try {
    res.json({ banners: await query('SELECT * FROM banners ORDER BY type, sort_order ASC') });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('banners'), async (req, res, next) => {
  try {
    const d = req.body?.banner || req.body || {};
    if (!d.title) return res.status(400).json({ error: 'Title is required' });
    const id = 'b-' + Date.now();
    await query(
      `INSERT INTO banners (id,type,eyebrow,title,subtitle,cta,href,image,badge,color,sort_order,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, d.type||'hero', d.eyebrow||'', d.title, d.subtitle||'', d.cta||'', d.href||'', d.image||'', d.badge||'', d.color||'', Number(d.sortOrder)||0, d.active!==false]
    );
    const saved = await queryOne('SELECT * FROM banners WHERE id = $1', [id]);
    logAudit(req, { action: 'banner.create', entity: 'banner', entityId: id, note: 'Created banner' });
    res.json({ banner: saved });
  } catch (e) { next(e); }
});

r.put('/:id', requireAuth, requirePermission('banners'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id FROM banners WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Banner not found' });
    const d = req.body?.banner || req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };
    if (d.type      !== undefined) add('type',       d.type);
    if (d.eyebrow   !== undefined) add('eyebrow',    d.eyebrow);
    if (d.title     !== undefined) add('title',      d.title);
    if (d.subtitle  !== undefined) add('subtitle',   d.subtitle);
    if (d.cta       !== undefined) add('cta',        d.cta);
    if (d.href      !== undefined) add('href',       d.href);
    if (d.image     !== undefined) add('image',      d.image);
    if (d.badge     !== undefined) add('badge',      d.badge);
    if (d.color     !== undefined) add('color',      d.color);
    if (d.sortOrder !== undefined) add('sort_order', Number(d.sortOrder));
    if (d.active    !== undefined) add('active',     !!d.active);
    if (!sets.length) return res.json({ ok: true });
    sets.push('updated_at = NOW()'); vals.push(req.params.id);
    const updated = await queryOne(`UPDATE banners SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    logAudit(req, { action: 'banner.update', entity: 'banner', entityId: req.params.id, note: 'Updated banner' });
    res.json({ banner: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('banners'), async (req, res, next) => {
  try {
    await query('DELETE FROM banners WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'banner.delete', entity: 'banner', entityId: req.params.id, note: 'Deleted banner' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
