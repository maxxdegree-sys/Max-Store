import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

function fromRow(t) {
  if (!t) return null;
  return {
    id: t.id, type: t.type, category: t.category,
    description: t.description, amount: Number(t.amount),
    date: t.date, method: t.method, status: t.status,
    reference: t.reference, createdAt: t.created_at
  };
}

r.get('/', requireAuth, requirePermission('accounts'), async (req, res, next) => {
  try {
    const { type, status, from, to, category } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const vals = []; let i = 1;
    if (type)     { sql += ` AND type = $${i++}`;     vals.push(type); }
    if (status)   { sql += ` AND status = $${i++}`;   vals.push(status); }
    if (from)     { sql += ` AND date >= $${i++}`;    vals.push(from); }
    if (to)       { sql += ` AND date <= $${i++}`;    vals.push(to); }
    if (category) { sql += ` AND category = $${i++}`; vals.push(category); }
    sql += ' ORDER BY date DESC, created_at DESC';
    const rows = (await query(sql, vals)).map(fromRow);

    let income = 0, expense = 0, receivable = 0;
    rows.forEach((t) => {
      if (t.type === 'income') {
        if (t.status === 'cleared') income += t.amount; else receivable += t.amount;
      } else expense += t.amount;
    });
    res.json({ transactions: rows, totals: { income, expense, receivable, net: income - expense } });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('accounts'), async (req, res, next) => {
  try {
    const d = req.body?.transaction || req.body || {};
    if (!d.type || !d.category) return res.status(400).json({ error: 'Type and category are required' });
    const id = 't-' + Date.now();
    await query(
      `INSERT INTO transactions (id,type,category,description,amount,date,method,status,reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, d.type==='expense'?'expense':'income', d.category, (d.description||'').trim(), Math.max(0,Math.round(Number(d.amount)||0)), d.date||new Date().toISOString().slice(0,10), d.method||'Cash', d.status==='pending'?'pending':'cleared', (d.reference||'').trim()]
    );
    const saved = fromRow(await queryOne('SELECT * FROM transactions WHERE id = $1', [id]));
    logAudit(req, { action: 'account.create', entity: 'transaction', entityId: id, note: d.type + ': ' + d.category + ' PKR ' + saved.amount });
    res.json({ transaction: saved });
  } catch (e) { next(e); }
});

r.put('/:id', requireAuth, requirePermission('accounts'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id FROM transactions WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Transaction not found' });
    const d = req.body?.transaction || req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };
    if (d.type        !== undefined) add('type',        d.type);
    if (d.category    !== undefined) add('category',    d.category);
    if (d.description !== undefined) add('description', d.description);
    if (d.amount      !== undefined) add('amount',      Math.max(0, Number(d.amount)));
    if (d.date        !== undefined) add('date',        d.date);
    if (d.method      !== undefined) add('method',      d.method);
    if (d.status      !== undefined) add('status',      d.status);
    if (d.reference   !== undefined) add('reference',   d.reference);
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    const updated = fromRow(await queryOne(`UPDATE transactions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals));
    logAudit(req, { action: 'account.update', entity: 'transaction', entityId: req.params.id, note: 'Updated transaction' });
    res.json({ transaction: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('accounts'), async (req, res, next) => {
  try {
    await query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'account.delete', entity: 'transaction', entityId: req.params.id, note: 'Deleted transaction' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/accounts/activity  — audit log viewer (activity log page)
r.get('/activity-log', requireAuth, requirePermission('activity'), async (req, res, next) => {
  try {
    const { from, to, action, userId, limit = 200 } = req.query;
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const vals = []; let i = 1;
    if (from)   { sql += ` AND at >= $${i++}`;       vals.push(from); }
    if (to)     { sql += ` AND at <= $${i++}`;       vals.push(to); }
    if (action) { sql += ` AND action ILIKE $${i++}`; vals.push('%'+action+'%'); }
    if (userId) { sql += ` AND user_id = $${i++}`;   vals.push(userId); }
    sql += ` ORDER BY at DESC LIMIT $${i}`;
    vals.push(Number(limit));
    res.json({ log: await query(sql, vals) });
  } catch (e) { next(e); }
});

export default r;
