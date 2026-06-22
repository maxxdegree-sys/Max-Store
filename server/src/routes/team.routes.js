import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, signToken, publicUser, computeCanImport } from '../auth.js';
import { requireExecutive, requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';
import { ROLE_PRESETS } from '../../../src/utils/permissions.js';

const r = Router();

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department || '',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    status: row.status,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}

// GET /api/team/assignees — minimal list for complaint assignment (no team permission required)
r.get('/assignees', requireAuth, requirePermission('complaints'), async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, name, department FROM admin_users WHERE status = 'active' ORDER BY name ASC`
    );
    res.json({
      users: rows.map((row) => ({
        id: row.id,
        name: row.name,
        department: row.department || ''
      }))
    });
  } catch (e) { next(e); }
});

// GET /api/team
r.get('/', requireAuth, requirePermission('team'), async (_req, res, next) => {
  try {
    const rows = await query('SELECT * FROM admin_users ORDER BY created_at ASC');
    res.json({ users: rows.map(rowToUser).map(publicUser) });
  } catch (e) { next(e); }
});

// POST /api/team  (executive)
r.post('/', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const { name, email, role = 'Custom', department = '', permissions, password } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const exists = await queryOne('SELECT id FROM admin_users WHERE lower(email) = lower($1)', [email]);
    if (exists) return res.status(409).json({ error: 'A user with this email already exists' });

    const perms = (Array.isArray(permissions) && permissions.length)
      ? permissions
      : (ROLE_PRESETS[role]?.permissions || ['dashboard']);
    const id = 'u-' + Date.now();
    const hash = bcrypt.hashSync(String(password || 'changeme123'), 8);

    await query(
      `INSERT INTO admin_users (id,name,email,role,department,permissions,status,password_hash,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',$7,NOW())`,
      [id, name.trim(), email.trim(), role, (department || '').trim(), JSON.stringify(perms), hash]
    );
    const newRow = await queryOne('SELECT * FROM admin_users WHERE id = $1', [id]);
    const user = rowToUser(newRow);
    logAudit(req, { action: 'team.add', entity: 'adminUser', entityId: id, after: { name: user.name, role: user.role }, note: 'Added team member' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

// PATCH /api/team/:id  (executive)
r.patch('/:id', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM admin_users WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    const u = rowToUser(row);
    const before = { role: u.role, status: u.status, permissions: [...(u.permissions || [])] };
    const { name, department, role, permissions, status } = req.body || {};
    const sets = []; const vals = []; let i = 1;
    if (name       !== undefined) { sets.push(`name = $${i++}`);        vals.push(name); }
    if (department !== undefined) { sets.push(`department = $${i++}`);  vals.push(department); }
    if (role       !== undefined) { sets.push(`role = $${i++}`);        vals.push(role); }
    if (Array.isArray(permissions)) { sets.push(`permissions = $${i++}`); vals.push(JSON.stringify(permissions)); }
    if (status     !== undefined) { sets.push(`status = $${i++}`);      vals.push(status); }
    if (sets.length) {
      vals.push(req.params.id);
      await query(`UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    }
    const updated = rowToUser(await queryOne('SELECT * FROM admin_users WHERE id = $1', [req.params.id]));
    logAudit(req, { action: 'team.update', entity: 'adminUser', entityId: u.id, before, after: { role: updated.role, status: updated.status, permissions: updated.permissions } });
    res.json({ user: publicUser(updated) });
  } catch (e) { next(e); }
});

// PATCH /api/team/:id/password  (executive)
r.patch('/:id/password', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const row = await queryOne('SELECT id, name FROM admin_users WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(String(password), 8), row.id]);
    logAudit(req, { action: 'team.password', entity: 'adminUser', entityId: row.id, note: 'Password changed for ' + row.name });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/team/:id  (executive)
r.delete('/:id', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM admin_users WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (row.id === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account' });
    if (row.role === 'Executive') {
      const count = await queryOne(`SELECT COUNT(*) AS c FROM admin_users WHERE role = 'Executive'`);
      if (Number(count.c) <= 1) return res.status(400).json({ error: 'Cannot remove the last executive' });
    }
    await query('DELETE FROM admin_users WHERE id = $1', [row.id]);
    logAudit(req, { action: 'team.remove', entity: 'adminUser', entityId: row.id, before: { name: row.name }, note: 'Removed team member' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/team/impersonate/:id  (executive)
r.post('/impersonate/:id', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM admin_users WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (row.status === 'suspended') return res.status(400).json({ error: 'That account is suspended' });
    const u = { id: row.id, name: row.name, email: row.email, role: row.role, department: row.department || '', permissions: row.permissions || [] };
    const importRow = await queryOne('SELECT value FROM settings WHERE key = $1', ['import']);
    u.canImport = computeCanImport(u, importRow ? importRow.value : {});
    const token = signToken(u);
    logAudit(req, { action: 'team.impersonate', entity: 'adminUser', entityId: row.id, note: req.user.name + " entered " + row.name + "'s account" });
    res.json({ token, user: { ...publicUser(u), impersonatedBy: req.user.id, impersonatorName: req.user.name } });
  } catch (e) { next(e); }
});

export default r;
