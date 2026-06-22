import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

function fromRow(c) {
  if (!c) return null;
  return {
    id: c.id, orderId: c.order_id, productId: c.product_id,
    name: c.name, email: c.email, phone: c.phone, city: c.city,
    kind: c.kind, subject: c.subject, message: c.message,
    status: c.status, priority: c.priority, date: c.date,
    replies: Array.isArray(c.replies) ? c.replies : [],
    internalNotes: c.internal_notes || '',
    assignee: c.assignee, assigneeName: c.assignee_name, assigneeDept: c.assignee_dept,
    notes: Array.isArray(c.notes) ? c.notes : [],
    handlerHistory: Array.isArray(c.handler_history) ? c.handler_history : [],
    changeHistory: Array.isArray(c.change_history) ? c.change_history : [],
    events: Array.isArray(c.events) ? c.events : [],
    createdAt: c.created_at, updatedAt: c.updated_at
  };
}

function genId(year) { return `AR-${year}-${Date.now().toString().slice(-4)}`; }

// Public — anyone can submit a complaint
r.post('/submit', async (req, res, next) => {
  try {
    const d = req.body || {};
    if (!d.subject || !d.message) return res.status(400).json({ error: 'Subject and message are required' });
    const year = new Date().getFullYear();
    const id = genId(year);
    const event = { id: randomUUID(), at: new Date().toISOString(), action: 'opened', detail: 'Ticket opened by customer', by: (d.name||'Customer').trim(), role: 'Customer' };
    await query(
      `INSERT INTO complaints (id,order_id,product_id,name,email,phone,city,kind,subject,message,status,priority,date,events,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'new','normal',CURRENT_DATE,$11,NOW(),NOW())`,
      [id, d.orderId||'', d.productId||'', (d.name||'').trim(), (d.email||'').trim(), (d.phone||'').trim(), (d.city||'').trim(), d.kind||'other', d.subject.trim(), d.message.trim(), JSON.stringify([event])]
    );
    res.json({ id, ok: true });
  } catch (e) { next(e); }
});

// Public — track by ticket ID (customer-visible fields only)
r.get('/track/:id', async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id,order_id,kind,subject,message,status,priority,date,replies,created_at FROM complaints WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json({
      ticket: {
        id: row.id, orderId: row.order_id, kind: row.kind,
        subject: row.subject, message: row.message,
        status: row.status, priority: row.priority, date: row.date,
        replies: Array.isArray(row.replies) ? row.replies : [],
        createdAt: row.created_at
      }
    });
  } catch (e) { next(e); }
});

r.get('/', requireAuth, requirePermission('complaints'), async (req, res, next) => {
  try {
    const { status, priority, assignee, search } = req.query;
    let sql = 'SELECT * FROM complaints WHERE 1=1';
    const vals = []; let i = 1;
    if (status)   { sql += ` AND status = $${i++}`;                             vals.push(status); }
    if (priority) { sql += ` AND priority = $${i++}`;                           vals.push(priority); }
    if (assignee) { sql += ` AND assignee = $${i++}`;                           vals.push(assignee); }
    if (search)   { sql += ` AND (id ILIKE $${i} OR name ILIKE $${i} OR subject ILIKE $${i})`; vals.push('%' + search + '%'); i++; }
    sql += ' ORDER BY created_at DESC';
    res.json({ complaints: (await query(sql, vals)).map(fromRow) });
  } catch (e) { next(e); }
});

r.get('/:id', requireAuth, requirePermission('complaints'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ complaint: fromRow(row) });
  } catch (e) { next(e); }
});

r.patch('/:id', requireAuth, requirePermission('complaints'), async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT * FROM complaints WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Ticket not found' });
    const c = fromRow(existing);
    const d = req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

    if (d.status   !== undefined && d.status !== c.status) {
      add('status', d.status);
      const ev = { id: randomUUID(), at: new Date().toISOString(), action: d.status === 'closed' ? 'closed' : 'status', detail: `Status changed from ${c.status} to ${d.status}`, by: req.user.name, role: req.user.role, field: 'status', from: c.status, to: d.status };
      add('events',         JSON.stringify([ev, ...c.events]));
      add('change_history', JSON.stringify([{ at: ev.at, by: req.user.name, field: 'status', from: c.status, to: d.status }, ...c.changeHistory]));
    }
    if (d.priority  !== undefined && d.priority !== c.priority) {
      add('priority', d.priority);
      const ev = { id: randomUUID(), at: new Date().toISOString(), action: 'priority', detail: `Priority changed to ${d.priority}`, by: req.user.name, role: req.user.role };
      add('events', JSON.stringify([ev, ...c.events]));
    }
    if (d.assignee !== undefined) {
      add('assignee',      d.assignee?.id || null);
      add('assignee_name', d.assignee?.name || '');
      add('assignee_dept', d.assignee?.department || '');
      const ev = { id: randomUUID(), at: new Date().toISOString(), action: 'assign', detail: `Assigned to ${d.assignee?.name || 'unassigned'}`, by: req.user.name };
      add('events',          JSON.stringify([ev, ...c.events]));
      add('handler_history', JSON.stringify([{ at: ev.at, from: c.assigneeName || null, to: d.assignee?.name || '', by: req.user.name }, ...c.handlerHistory]));
    }
    if (d.reply     !== undefined) {
      const newReply = { who: req.user.name, date: new Date().toISOString().slice(0,10), text: d.reply };
      add('replies', JSON.stringify([...c.replies, newReply]));
      const ev = { id: randomUUID(), at: new Date().toISOString(), action: 'reply', detail: 'Replied to customer', by: req.user.name };
      add('events', JSON.stringify([ev, ...c.events]));
      if (c.status === 'new') { add('status', 'in-progress'); }
    }
    if (d.internalNote !== undefined) {
      const note = { id: randomUUID(), at: new Date().toISOString(), by: req.user.name, role: req.user.role, dept: req.user.department||'', confidential: !!d.confidential, text: d.internalNote };
      add('notes', JSON.stringify([note, ...c.notes]));
    }
    if (d.internalNotes !== undefined) add('internal_notes', d.internalNotes);

    if (!sets.length) return res.json({ complaint: c });
    sets.push('updated_at = NOW()'); vals.push(req.params.id);
    const updated = fromRow(await queryOne(`UPDATE complaints SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals));
    logAudit(req, { action: 'complaint.update', entity: 'complaint', entityId: req.params.id, ticketId: req.params.id, note: 'Updated ticket' });
    res.json({ complaint: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('complaints'), async (req, res, next) => {
  try {
    await query('DELETE FROM complaints WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'complaint.delete', entity: 'complaint', entityId: req.params.id, note: 'Deleted ticket' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
