import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './db/pg.js';
import { isExecutive } from '../../src/utils/permissions.js';

const JWT_SECRET = process.env.JWT_SECRET || 'al-rafiq-dev-secret-change-me';
const TOKEN_TTL = '12h';

export function computeCanImport(user, importSettings) {
  if (isExecutive(user.permissions || [])) return true;
  const s = importSettings || {};
  return !!s.enabled && Array.isArray(s.allowedUserIds) && s.allowedUserIds.includes(user.id);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      canImport: user.canImport || false
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// Token for a storefront customer (separate from admin tokens via `kind`).
export function signCustomerToken(c) {
  return jwt.sign(
    { id: c.id, email: c.email, name: c.name, kind: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Guard for customer-only endpoints: valid token AND kind === 'customer'.
export function requireCustomer(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.kind !== 'customer') return res.status(403).json({ error: 'Customer session required.' });
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

export function publicUser(u) {
  if (!u) return u;
  const { passwordHash, password_hash, ...safe } = u;
  return safe;
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department || '',
    permissions: Array.isArray(row.permissions) ? row.permissions : (row.permissions || []),
    status: row.status,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}

export async function login(email, password) {
  const e = String(email || '').trim().toLowerCase();
  const p = String(password || '');

  const row = await queryOne(
    'SELECT * FROM admin_users WHERE lower(email) = $1',
    [e]
  );
  const user = rowToUser(row);

  if (!user) return { error: 'No admin account found for this email.' };
  if (user.status === 'suspended') return { error: 'This account is suspended.' };
  if (!user.passwordHash) return { error: 'No password set. Ask an executive to set your password from the Team page.' };

  const ok = bcrypt.compareSync(p, user.passwordHash);
  if (!ok) return { error: 'Incorrect password.' };

  const nowIso = new Date().toISOString();
  await query('UPDATE admin_users SET last_login = $1 WHERE id = $2', [nowIso, user.id]);

  const importRow = await queryOne('SELECT value FROM settings WHERE key = $1', ['import']);
  const importSettings = importRow ? importRow.value : {};

  const safe = publicUser(user);
  safe.canImport = computeCanImport(user, importSettings);
  return { token: signToken({ ...user, canImport: safe.canImport }), user: safe };
}

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.isVendor) return res.status(403).json({ error: 'Admin access only.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
