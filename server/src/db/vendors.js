// Vendor (supplier company) data layer backed by PostgreSQL.
import bcrypt from 'bcryptjs';
import { query, queryOne } from './pg.js';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contactName: row.contact_name || '',
    phone: row.phone || '',
    address: row.address || '',
    status: row.status || 'active',
    commissionPct: Number(row.commission_pct) || 0,
    notes: row.notes || '',
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}

export async function findVendorByEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const row = await queryOne('SELECT * FROM vendors WHERE lower(email) = $1', [e]);
  return fromRow(row);
}

export async function findVendor(id) {
  const row = await queryOne('SELECT * FROM vendors WHERE id = $1', [id]);
  return fromRow(row);
}

export async function listVendors() {
  const rows = await query('SELECT * FROM vendors ORDER BY created_at ASC');
  return rows.map(fromRow);
}

export async function createVendor(payload = {}) {
  const id = payload.id || ('v-' + Date.now());
  const row = await queryOne(
    `INSERT INTO vendors (id, name, email, password_hash, contact_name, phone, address, status, commission_pct, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      id,
      (payload.name || '').trim(),
      (payload.email || '').trim().toLowerCase(),
      bcrypt.hashSync(String(payload.password || 'changeme123'), 8),
      payload.contactName || '',
      payload.phone || '',
      payload.address || '',
      payload.status || 'active',
      Number(payload.commissionPct) || 0,
      payload.notes || ''
    ]
  );
  return fromRow(row);
}

export async function updateVendor(id, patch = {}) {
  const cols = {
    name: 'name', email: 'email', contactName: 'contact_name', phone: 'phone',
    address: 'address', status: 'status', commissionPct: 'commission_pct', notes: 'notes'
  };
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of Object.entries(cols)) {
    if (patch[key] === undefined) continue;
    let v = patch[key];
    if (key === 'email') v = String(v).trim().toLowerCase();
    if (key === 'commissionPct') v = Number(v) || 0;
    sets.push(`${col} = $${i++}`);
    vals.push(v);
  }
  if (!sets.length) return findVendor(id);
  vals.push(id);
  const row = await queryOne(`UPDATE vendors SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  return fromRow(row);
}

export async function setVendorPassword(id, password) {
  await query('UPDATE vendors SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(String(password), 8), id]);
}

export async function deleteVendor(id) {
  await query('DELETE FROM vendors WHERE id = $1', [id]);
}

export async function updateVendorLastLogin(id) {
  await query('UPDATE vendors SET last_login = NOW() WHERE id = $1', [id]);
}

export function publicVendor(v) {
  if (!v) return v;
  const { passwordHash, password_hash, ...safe } = v;
  return safe;
}
