// Vendor (company / supplier) portal routes. Mounted at /api/vendor.
// Vendors get their own JWT (isVendor flag) separate from admin/customer tokens.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { query, queryOne } from '../db/pg.js';
import { findVendor, findVendorByEmail, updateVendorLastLogin, publicVendor } from '../db/vendors.js';
import { processImage, ALLOWED_MIME } from '../util/images.js';
import { commissionForLineItem } from '../util/commission.js';
import { createNotification, notifyCustomerByPhone } from '../services/notifications.js';
import { syncOrderAccounts } from '../services/orderAccounting.js';
import { COURIERS } from '../../../src/utils/couriers.js';

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'al-rafiq-dev-secret-change-me';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG and WEBP images are allowed'))
});

const uploadMw = (req, res, next) =>
  upload.array('images', 4)(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next()));

async function requireVendor(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Vendor login required.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isVendor) return res.status(403).json({ error: 'Vendor access only.' });
    const vendor = await findVendor(decoded.vendorId);
    if (!vendor) return res.status(401).json({ error: 'Vendor account not found.' });
    if (vendor.status === 'suspended') {
      return res.status(401).json({ error: 'This account is suspended. Contact Maxx admin.' });
    }
    req.vendor = {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      commissionPct: Number(vendor.commissionPct) || 0
    };
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    next(e);
  }
}

// Orders that contain at least one of this vendor's products. The checkout
// flow stores the product id in items[].sku, so we match on that.
async function vendorOrders(vendorId) {
  const prods = await query('SELECT id FROM products WHERE vendor_id = $1', [vendorId]);
  const ids = prods.map((p) => String(p.id));
  if (!ids.length) return [];
  const rows = await query(
    `SELECT * FROM orders o
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(o.items) AS it
        WHERE (it->>'sku') = ANY($1) OR (it->>'id') = ANY($1)
      )
      ORDER BY o.created_at DESC`,
    [ids]
  );
  const idSet = new Set(ids);
  return rows.map((o) => {
    const all = Array.isArray(o.items) ? o.items : [];
    const mine = all
      .filter((it) => idSet.has(String(it.sku || it.id || '')))
      .map((it) => ({
        product_id: String(it.sku || it.id || ''),
        sku: it.sku || '',
        name: it.name || it.title || '',
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0,
        subtotal: (Number(it.price) || 0) * (Number(it.qty) || 1)
      }));
    return {
      id: o.id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone || '',
      city: o.city,
      total: mine.reduce((s, it) => s + it.subtotal, 0),
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      delivery_status: o.delivery_status,
      tracking: o.tracking || '',
      courier: o.courier || '',
      est_delivery: o.est_delivery || null,
      created_at: o.created_at,
      items: mine
    };
  });
}

function normalizeListingRequest(row) {
  if (!row) return row;
  const product = typeof row.product === 'string' ? JSON.parse(row.product) : (row.product || {});
  return { ...row, product };
}

// --- POST /auth/login ---
r.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const vendor = await findVendorByEmail(email);
    if (!vendor) return res.status(401).json({ error: 'No vendor account found for this email.' });
    if (vendor.status === 'suspended') return res.status(401).json({ error: 'This account is suspended. Contact Maxx admin.' });
    if (!vendor.passwordHash) return res.status(401).json({ error: 'No password set yet. Contact Maxx admin.' });
    const ok = bcrypt.compareSync(String(password), vendor.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });
    const token = jwt.sign(
      { vendorId: vendor.id, name: vendor.name, email: vendor.email, isVendor: true },
      JWT_SECRET, { expiresIn: '12h' }
    );
    updateVendorLastLogin(vendor.id).catch(() => {});
    res.json({ token, vendor: publicVendor(vendor) });
  } catch (e) { next(e); }
});

r.use(requireVendor);

// --- GET /me ---
r.get('/me', async (req, res, next) => {
  try {
    const v = await findVendor(req.vendor.id);
    if (!v) return res.status(404).json({ error: 'Vendor not found.' });
    res.json({ vendor: publicVendor(v) });
  } catch (e) { next(e); }
});

// --- POST /uploads — product images for listing requests ---
r.post('/uploads', uploadMw, async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No images provided.' });
    const results = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        results.push({ error: f.originalname + ' is over 5 MB', originalName: f.originalname });
        continue;
      }
      try {
        const out = await processImage(f.buffer, f.mimetype);
        results.push({ ...out, originalName: f.originalname });
      } catch (e) {
        results.push({ error: e.message, originalName: f.originalname });
      }
    }
    res.json({ images: results });
  } catch (e) { next(e); }
});

// --- GET /products ---
r.get('/products', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC',
      [req.vendor.id]
    );
    const products = rows.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand || '',
      category: p.category || '',
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || 0,
      stock: Number(p.stock) || 0,
      status: p.status || 'active',
      images: Array.isArray(p.images) ? p.images : [],
      created_at: p.created_at
    }));
    res.json({ products });
  } catch (e) { next(e); }
});

// --- GET /orders ---
r.get('/orders', async (req, res, next) => {
  try {
    res.json({ orders: await vendorOrders(req.vendor.id) });
  } catch (e) { next(e); }
});

// --- GET /revenue --- (delivered orders only, price-slab commission per line item)
r.get('/revenue', async (req, res, next) => {
  try {
    const orders = await vendorOrders(req.vendor.id);
    const delivered = orders.filter((o) => o.delivery_status === 'Delivered');
    let gross = 0;
    let commission = 0;
    let units = 0;
    const breakdown = [];
    for (const o of delivered) {
      for (const it of o.items) {
        const comm = commissionForLineItem(it.price, it.qty);
        gross += comm.lineTotal;
        commission += comm.commission;
        units += it.qty;
        breakdown.push({
          orderId: o.id,
          productId: it.product_id,
          name: it.name,
          qty: it.qty,
          unitPrice: it.price,
          lineTotal: comm.lineTotal,
          commissionRate: comm.rate,
          commissionAmount: comm.commission,
          sellerReceives: comm.sellerReceives,
          slabLabel: comm.slabLabel
        });
      }
    }
    const net = Math.round((gross - commission) * 100) / 100;
    res.json({
      revenue: gross,
      commission,
      net,
      units,
      deliveredOrders: delivered.length,
      totalOrders: orders.length,
      breakdown,
      commissionModel: 'price-slab'
    });
  } catch (e) { next(e); }
});

// --- PATCH /orders/:id — vendor manages shipping & payment for their orders ---
r.patch('/orders/:id', async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const existing = await queryOne('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!existing) return res.status(404).json({ error: 'Order not found.' });

    const prods = await query('SELECT id FROM products WHERE vendor_id = $1', [req.vendor.id]);
    const ids = new Set(prods.map((p) => String(p.id)));
    const items = Array.isArray(existing.items) ? existing.items : [];
    const hasMine = items.some((it) => ids.has(String(it.sku || it.id || '')));
    if (!hasMine) return res.status(403).json({ error: 'This order does not contain your products.' });

    const d = req.body || {};
    const sets = [];
    const vals = [];
    let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

    const delStatuses = ['Placed', 'Processing', 'In Transit', 'Delivered', 'Cancelled', 'Returned'];

    // Payment status is admin-only — vendors may only manage delivery/shipping.
    // Any paymentStatus sent by a vendor is ignored.
    if (d.deliveryStatus !== undefined) {
      if (!delStatuses.includes(d.deliveryStatus)) return res.status(400).json({ error: 'Invalid delivery status.' });
      add('delivery_status', d.deliveryStatus);
    }
    if (d.tracking !== undefined) add('tracking', String(d.tracking || '').trim());
    if (d.courier !== undefined) add('courier', String(d.courier || '').trim());
    if (d.estDelivery !== undefined) add('est_delivery', d.estDelivery || null);

    if (d.deliveryStatus !== undefined && d.deliveryStatus !== existing.delivery_status) {
      const prev = Array.isArray(existing.timeline) ? existing.timeline : [];
      const entry = {
        status: d.deliveryStatus,
        at: new Date().toISOString(),
        note: (d.statusNote || `Updated by vendor ${req.vendor.name}`).trim()
      };
      add('timeline', JSON.stringify([...prev, entry]));
    }

    if (!sets.length) {
      const mine = await vendorOrders(req.vendor.id);
      const found = mine.find((o) => o.id === orderId);
      return res.json({ order: found || null });
    }

    sets.push('updated_at = NOW()');
    vals.push(orderId);
    await query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${i}`, vals);

    const fullOrder = await queryOne('SELECT * FROM orders WHERE id = $1', [orderId]);
    syncOrderAccounts(fullOrder).catch((e) => console.warn('[accounts] sync failed:', e.message));

    notifyCustomerByPhone(existing.customer_phone, {
      title: `Order ${orderId} update`,
      body: d.deliveryStatus
        ? `Delivery status: ${d.deliveryStatus}${d.tracking ? ` · Tracking: ${d.tracking}` : ''}`
        : `Your order ${orderId} has been updated`,
      link: `/track/${orderId}`
    }).catch(() => {});

    const mine = await vendorOrders(req.vendor.id);
    const found = mine.find((o) => o.id === orderId);
    res.json({ order: found || null, couriers: COURIERS });
  } catch (e) { next(e); }
});

// --- GET /couriers ---
r.get('/couriers', (_req, res) => res.json({ couriers: COURIERS }));

// --- GET /listing-requests ---
r.get('/listing-requests', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM listing_requests WHERE vendor_id = $1 ORDER BY created_at DESC',
      [req.vendor.id]
    );
    res.json({ requests: rows.map(normalizeListingRequest) });
  } catch (e) { next(e); }
});

// --- POST /listing-requests ---
r.post('/listing-requests', async (req, res, next) => {
  try {
    const { product, notes } = req.body || {};
    if (!product?.title) return res.status(400).json({ error: 'Product title is required.' });
    const id = 'lr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const [row] = await query(
      `INSERT INTO listing_requests (id, vendor_id, vendor_name, product, status, notes)
       VALUES ($1,$2,$3,$4,'pending',$5)
       RETURNING *`,
      [id, req.vendor.id, req.vendor.name, JSON.stringify(product), notes || null]
    );
    res.json({ request: normalizeListingRequest(row) });
  } catch (e) { next(e); }
});

export default r;
