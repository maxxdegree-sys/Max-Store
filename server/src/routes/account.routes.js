import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/pg.js';
import { signCustomerToken, requireCustomer } from '../auth.js';

const r = Router();

const publicCustomer = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  city: c.city,
  address: c.address,
  orders: Number(c.orders) || 0,
  totalSpend: Number(c.total_spend) || 0
});

const publicAddress = (a) => ({
  id: a.id,
  label: a.label || 'Home',
  name: a.name || '',
  phone: a.phone || '',
  address: a.address || '',
  city: a.city || '',
  province: a.province || '',
  isDefault: !!a.is_default
});

// Keep the customer's primary address/city in sync with their default address,
// so checkout prefill and admin views always show the current shipping target.
async function syncDefaultToCustomer(customerId) {
  const def = await queryOne(
    'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC LIMIT 1',
    [customerId]
  );
  if (def) {
    await query('UPDATE customers SET address = $1, city = $2 WHERE id = $3', [def.address || '', def.city || '', customerId]);
  }
}

// Register a storefront customer (or claim a guest record created at checkout).
r.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    if (!name || !e || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await queryOne('SELECT * FROM customers WHERE lower(email) = $1 LIMIT 1', [e]);
    const hash = bcrypt.hashSync(String(password), 10);

    let customer;
    if (existing && existing.password_hash) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    } else if (existing) {
      // Guest record from a prior checkout — attach login credentials to it.
      // Keep the existing phone if set, since orders are linked to the buyer by phone.
      customer = await queryOne(
        `UPDATE customers SET name = $1, phone = COALESCE(NULLIF(phone,''), $2), password_hash = $3, last_activity = CURRENT_DATE
         WHERE id = $4 RETURNING *`,
        [name.trim(), (phone || '').trim(), hash, existing.id]
      );
    } else {
      const id = 'C-' + Date.now();
      customer = await queryOne(
        `INSERT INTO customers (id,name,email,phone,city,address,orders,total_spend,payment_status,type,tags,notes,created_at,last_activity,active,password_hash)
         VALUES ($1,$2,$3,$4,'','',0,0,'Paid','New','','',CURRENT_DATE,CURRENT_DATE,true,$5) RETURNING *`,
        [id, name.trim(), e, (phone || '').trim(), hash]
      );
    }

    const safe = publicCustomer(customer);
    res.json({ token: signCustomerToken(customer), user: { ...safe, kind: 'customer' } });
  } catch (e) { next(e); }
});

// Customer login.
r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    if (!e || !password) return res.status(400).json({ error: 'Email and password are required' });
    const c = await queryOne('SELECT * FROM customers WHERE lower(email) = $1 LIMIT 1', [e]);
    if (!c || !c.password_hash) return res.status(401).json({ error: 'No account found for this email.' });
    if (!bcrypt.compareSync(String(password), c.password_hash)) return res.status(401).json({ error: 'Incorrect password.' });
    await query('UPDATE customers SET last_activity = CURRENT_DATE WHERE id = $1', [c.id]);
    const safe = publicCustomer(c);
    res.json({ token: signCustomerToken(c), user: { ...safe, kind: 'customer' } });
  } catch (e) { next(e); }
});

// Current customer profile + their orders + saved addresses + wishlist.
r.get('/me', requireCustomer, async (req, res, next) => {
  try {
    const c = await queryOne('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    if (!c) return res.status(404).json({ error: 'Account not found' });
    const phone = (c.phone || '').trim();
    const orders = phone
      ? await query('SELECT id,total,delivery_status,payment_status,items,created_at FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC', [phone])
      : [];
    const addresses = await query('SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC', [c.id]);
    const wl = await query('SELECT product_id FROM customer_wishlist WHERE customer_id = $1', [c.id]);
    res.json({
      user: { ...publicCustomer(c), kind: 'customer' },
      orders: orders.map((o) => ({
        id: o.id,
        total: Number(o.total),
        deliveryStatus: o.delivery_status,
        paymentStatus: o.payment_status,
        items: Array.isArray(o.items) ? o.items.length : 0,
        date: String(o.created_at || '').slice(0, 10)
      })),
      addresses: addresses.map(publicAddress),
      wishlist: wl.map((x) => x.product_id)
    });
  } catch (e) { next(e); }
});

// Update profile (name / phone / city). Email stays fixed (it's the login key).
r.patch('/me', requireCustomer, async (req, res, next) => {
  try {
    const { name, phone, city } = req.body || {};
    const c = await queryOne('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    if (!c) return res.status(404).json({ error: 'Account not found' });
    if (name !== undefined && !String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    const updated = await queryOne(
      `UPDATE customers SET
         name  = COALESCE(NULLIF($1,''), name),
         phone = COALESCE($2, phone),
         city  = COALESCE($3, city),
         last_activity = CURRENT_DATE
       WHERE id = $4 RETURNING *`,
      [name !== undefined ? String(name).trim() : '', phone !== undefined ? String(phone).trim() : null, city !== undefined ? String(city).trim() : null, c.id]
    );
    res.json({ user: { ...publicCustomer(updated), kind: 'customer' } });
  } catch (e) { next(e); }
});

// --- Saved addresses -------------------------------------------------------
r.get('/addresses', requireCustomer, async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC', [req.customer.id]);
    res.json({ addresses: rows.map(publicAddress) });
  } catch (e) { next(e); }
});

r.post('/addresses', requireCustomer, async (req, res, next) => {
  try {
    const { label, name, phone, address, city, province, isDefault } = req.body || {};
    if (!address || !String(address).trim()) return res.status(400).json({ error: 'Address is required' });
    const cid = req.customer.id;
    const count = await queryOne('SELECT COUNT(*)::int AS n FROM customer_addresses WHERE customer_id = $1', [cid]);
    const makeDefault = !!isDefault || (count?.n || 0) === 0; // first address is always default
    if (makeDefault) await query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [cid]);
    const id = 'ADDR-' + Date.now();
    const row = await queryOne(
      `INSERT INTO customer_addresses (id,customer_id,label,name,phone,address,city,province,is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, cid, (label || 'Home').trim(), (name || '').trim(), (phone || '').trim(), String(address).trim(), (city || '').trim(), (province || '').trim(), makeDefault]
    );
    await syncDefaultToCustomer(cid);
    res.json({ address: publicAddress(row) });
  } catch (e) { next(e); }
});

r.patch('/addresses/:id', requireCustomer, async (req, res, next) => {
  try {
    const cid = req.customer.id;
    const existing = await queryOne('SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2', [req.params.id, cid]);
    if (!existing) return res.status(404).json({ error: 'Address not found' });
    const { label, name, phone, address, city, province, isDefault } = req.body || {};
    if (isDefault) await query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [cid]);
    const row = await queryOne(
      `UPDATE customer_addresses SET
         label    = COALESCE($1, label),
         name     = COALESCE($2, name),
         phone    = COALESCE($3, phone),
         address  = COALESCE(NULLIF($4,''), address),
         city     = COALESCE($5, city),
         province = COALESCE($6, province),
         is_default = COALESCE($7, is_default)
       WHERE id = $8 AND customer_id = $9 RETURNING *`,
      [
        label !== undefined ? String(label).trim() : null,
        name !== undefined ? String(name).trim() : null,
        phone !== undefined ? String(phone).trim() : null,
        address !== undefined ? String(address).trim() : '',
        city !== undefined ? String(city).trim() : null,
        province !== undefined ? String(province).trim() : null,
        isDefault === undefined ? null : !!isDefault,
        req.params.id, cid
      ]
    );
    await syncDefaultToCustomer(cid);
    res.json({ address: publicAddress(row) });
  } catch (e) { next(e); }
});

r.delete('/addresses/:id', requireCustomer, async (req, res, next) => {
  try {
    const cid = req.customer.id;
    const existing = await queryOne('SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2', [req.params.id, cid]);
    if (!existing) return res.status(404).json({ error: 'Address not found' });
    await query('DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2', [req.params.id, cid]);
    // If we removed the default, promote the most recent remaining address.
    if (existing.is_default) {
      const next = await queryOne('SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1', [cid]);
      if (next) await query('UPDATE customer_addresses SET is_default = true WHERE id = $1', [next.id]);
    }
    await syncDefaultToCustomer(cid);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- Account-linked wishlist ----------------------------------------------
r.get('/wishlist', requireCustomer, async (req, res, next) => {
  try {
    const rows = await query('SELECT product_id FROM customer_wishlist WHERE customer_id = $1', [req.customer.id]);
    res.json({ productIds: rows.map((x) => x.product_id) });
  } catch (e) { next(e); }
});

// Replace the whole wishlist (used to sync the client list to the server).
r.put('/wishlist', requireCustomer, async (req, res, next) => {
  try {
    const cid = req.customer.id;
    const ids = Array.isArray(req.body?.productIds) ? [...new Set(req.body.productIds.map(String))] : [];
    await query('DELETE FROM customer_wishlist WHERE customer_id = $1', [cid]);
    for (const pid of ids) {
      await query('INSERT INTO customer_wishlist (customer_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cid, pid]);
    }
    res.json({ productIds: ids });
  } catch (e) { next(e); }
});

// Change password.
r.patch('/password', requireCustomer, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const c = await queryOne('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    if (!c) return res.status(404).json({ error: 'Account not found' });
    if (c.password_hash && !bcrypt.compareSync(String(currentPassword || ''), c.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(String(newPassword), 10), c.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
