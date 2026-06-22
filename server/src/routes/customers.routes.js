import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

function fromRow(c) {
  if (!c) return null;
  return {
    id: c.id, name: c.name, email: c.email, phone: c.phone,
    city: c.city, address: c.address,
    orders: Number(c.orders), totalSpend: Number(c.total_spend),
    paymentStatus: c.payment_status, type: c.type,
    tags: c.tags, notes: c.notes,
    createdAt: c.created_at, lastActivity: c.last_activity,
    active: c.active
  };
}

r.get('/', requireAuth, requirePermission('customers'), async (req, res, next) => {
  try {
    const { search, city, type, active } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const vals = []; let i = 1;
    if (search) { sql += ` AND (name ILIKE $${i} OR email ILIKE $${i} OR phone ILIKE $${i})`; vals.push('%' + search + '%'); i++; }
    if (city)   { sql += ` AND lower(city) = lower($${i++})`;  vals.push(city); }
    if (type)   { sql += ` AND type = $${i++}`;                vals.push(type); }
    if (active === 'true')  sql += ' AND active = true';
    if (active === 'false') sql += ' AND active = false';
    sql += ' ORDER BY created_at DESC';
    res.json({ customers: (await query(sql, vals)).map(fromRow) });
  } catch (e) { next(e); }
});

r.get('/:id', requireAuth, requirePermission('customers'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer: fromRow(row) });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('customers'), async (req, res, next) => {
  try {
    const d = req.body?.customer || req.body || {};
    if (!d.name) return res.status(400).json({ error: 'Name is required' });
    const id = 'C-' + Date.now();
    await query(
      `INSERT INTO customers (id,name,email,phone,city,address,orders,total_spend,payment_status,type,tags,notes,created_at,last_activity,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE,CURRENT_DATE,true)`,
      [id, d.name, d.email||'', d.phone||'', d.city||'', d.address||'', 0, 0, 'Paid', d.type||'New', d.tags||'', d.notes||'']
    );
    const saved = fromRow(await queryOne('SELECT * FROM customers WHERE id = $1', [id]));
    logAudit(req, { action: 'customer.create', entity: 'customer', entityId: id, after: { name: d.name }, note: 'Created customer' });
    res.json({ customer: saved });
  } catch (e) { next(e); }
});

r.put('/:id', requireAuth, requirePermission('customers'), async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT id FROM customers WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });
    const d = req.body?.customer || req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };
    if (d.name          !== undefined) add('name',           d.name);
    if (d.email         !== undefined) add('email',          d.email);
    if (d.phone         !== undefined) add('phone',          d.phone);
    if (d.city          !== undefined) add('city',           d.city);
    if (d.address       !== undefined) add('address',        d.address);
    if (d.orders        !== undefined) add('orders',         Number(d.orders));
    if (d.totalSpend    !== undefined) add('total_spend',    Number(d.totalSpend));
    if (d.paymentStatus !== undefined) add('payment_status', d.paymentStatus);
    if (d.type          !== undefined) add('type',           d.type);
    if (d.tags          !== undefined) add('tags',           d.tags);
    if (d.notes         !== undefined) add('notes',          d.notes);
    if (d.active        !== undefined) add('active',         d.active);
    if (d.lastActivity  !== undefined) add('last_activity',  d.lastActivity);
    if (!sets.length) return res.json({ customer: fromRow(existing) });
    vals.push(req.params.id);
    const updated = fromRow(await queryOne(`UPDATE customers SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals));
    logAudit(req, { action: 'customer.update', entity: 'customer', entityId: req.params.id, note: 'Updated customer' });
    res.json({ customer: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('customers'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id, name FROM customers WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    await query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'customer.delete', entity: 'customer', entityId: req.params.id, before: { name: row.name }, note: 'Deleted customer' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
