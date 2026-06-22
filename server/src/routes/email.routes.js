import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

// Public — storefront newsletter subscription.
r.post('/subscribe', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email is required' });
    const existing = await queryOne('SELECT id FROM email_contacts WHERE lower(email) = $1 LIMIT 1', [email]);
    if (!existing) {
      await query(
        `INSERT INTO email_contacts (id,name,email,phone,city,source,tags,subscribed)
         VALUES ($1,'',$2,'','','newsletter','',true)`,
        ['ec-' + Date.now(), email]
      );
    } else {
      await query('UPDATE email_contacts SET subscribed = true WHERE id = $1', [existing.id]);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/email/contacts
r.get('/contacts', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    const { search, city, subscribed } = req.query;
    let sql = 'SELECT * FROM email_contacts WHERE 1=1';
    const vals = []; let i = 1;
    if (search)              { sql += ` AND (name ILIKE $${i} OR email ILIKE $${i})`; vals.push('%'+search+'%'); i++; }
    if (city)                { sql += ` AND lower(city) = lower($${i++})`;             vals.push(city); }
    if (subscribed === 'true')  sql += ' AND subscribed = true';
    if (subscribed === 'false') sql += ' AND subscribed = false';
    sql += ' ORDER BY created_at DESC';
    res.json({ contacts: await query(sql, vals) });
  } catch (e) { next(e); }
});

// POST /api/email/contacts  (single add or bulk)
r.post('/contacts', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    const { contacts, contact } = req.body || {};
    const list = contacts || (contact ? [contact] : []);
    if (!list.length) return res.status(400).json({ error: 'No contacts provided' });
    let added = 0;
    for (const c of list) {
      if (!c.email) continue;
      const email = String(c.email).trim().toLowerCase();
      const existing = await queryOne('SELECT id FROM email_contacts WHERE lower(email) = lower($1) LIMIT 1', [email]);
      if (existing) {
        await query('UPDATE email_contacts SET subscribed = true, name = COALESCE(NULLIF($1,\'\'), name) WHERE id = $2', [c.name || '', existing.id]);
      } else {
        await query(
          `INSERT INTO email_contacts (id,name,email,phone,city,source,tags,subscribed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
          ['ec-' + Date.now() + '-' + added, c.name || '', email, c.phone || '', c.city || '', c.source || 'manual', c.tags || '']
        );
        added++;
      }
    }
    logAudit(req, { action: 'email.addContacts', entity: 'email', note: added + ' contact(s) added' });
    res.json({ ok: true, added });
  } catch (e) { next(e); }
});

r.delete('/contacts/:id', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    await query('DELETE FROM email_contacts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/email/campaigns
r.get('/campaigns', requireAuth, requirePermission('email'), async (_req, res, next) => {
  try {
    res.json({ campaigns: await query('SELECT * FROM email_campaigns ORDER BY created_at DESC') });
  } catch (e) { next(e); }
});

// POST /api/email/campaigns
r.post('/campaigns', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    const d = req.body?.campaign || req.body || {};
    if (!d.subject) return res.status(400).json({ error: 'Subject is required' });
    const id = 'camp-' + Date.now();
    await query(
      `INSERT INTO email_campaigns (id,subject,body,status) VALUES ($1,$2,$3,'draft')`,
      [id, d.subject, d.body||'']
    );
    const saved = await queryOne('SELECT * FROM email_campaigns WHERE id = $1', [id]);
    logAudit(req, { action: 'email.createCampaign', entity: 'email', entityId: id, note: 'Created campaign: ' + d.subject });
    res.json({ campaign: saved });
  } catch (e) { next(e); }
});

// PATCH /api/email/campaigns/:id  (update or mark sent)
r.patch('/campaigns/:id', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id FROM email_campaigns WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Campaign not found' });
    const d = req.body || {};
    const sets = []; const vals = []; let i = 1;
    if (d.subject          !== undefined) { sets.push(`subject = $${i++}`);          vals.push(d.subject); }
    if (d.body             !== undefined) { sets.push(`body = $${i++}`);             vals.push(d.body); }
    if (d.status           !== undefined) { sets.push(`status = $${i++}`);           vals.push(d.status); }
    if (d.recipientCount   !== undefined) { sets.push(`recipient_count = $${i++}`);  vals.push(d.recipientCount); }
    if (d.sentAt           !== undefined) { sets.push(`sent_at = $${i++}`);          vals.push(d.sentAt); }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    const updated = await queryOne(`UPDATE email_campaigns SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    logAudit(req, { action: 'email.updateCampaign', entity: 'email', entityId: req.params.id, note: 'Updated campaign' });
    res.json({ campaign: updated });
  } catch (e) { next(e); }
});

r.delete('/campaigns/:id', requireAuth, requirePermission('email'), async (req, res, next) => {
  try {
    await query('DELETE FROM email_campaigns WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
