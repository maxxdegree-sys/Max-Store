import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';
import { validateCoupon, incrementCouponUse } from '../coupon.js';
import { commissionForLineItem } from '../util/commission.js';
import { createNotification, notifyCustomerByPhone, notifyVendorsForOrder } from '../services/notifications.js';
import { syncOrderAccounts } from '../services/orderAccounting.js';

const r = Router();

/** Enrich checkout line items with product data + per-item commission (price slabs). */
async function enrichOrderItems(rawItems = []) {
  const out = [];
  for (const it of rawItems) {
    const pid = String(it.sku || it.id || '');
    const prod = pid ? await queryOne('SELECT id, category, subcategory, vendor_id, title FROM products WHERE id = $1', [pid]) : null;
    const price = Number(it.price) || 0;
    const qty = Number(it.qty) || 1;
    const comm = commissionForLineItem(price, qty);
    out.push({
      ...it,
      sku: pid || it.sku,
      name: it.name || prod?.title || '',
      category: it.category || prod?.category || '',
      subcategory: it.subcategory || prod?.subcategory || '',
      vendorId: prod?.vendor_id || it.vendorId || null,
      commissionRate: comm.rate,
      commissionAmount: comm.commission,
      sellerReceives: comm.sellerReceives,
      commissionSlab: comm.slabLabel
    });
  }
  return out;
}

function fromRow(o) {
  if (!o) return null;
  return {
    id: o.id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    city: o.city,
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    tax: Number(o.tax),
    shipping: Number(o.shipping),
    total: Number(o.total),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    deliveryStatus: o.delivery_status,
    tracking: o.tracking || '',
    courier: o.courier || '',
    estDelivery: o.est_delivery || null,
    timeline: Array.isArray(o.timeline) ? o.timeline : [],
    assignedStaff: o.assigned_staff || '',
    notes: o.notes || '',
    category: o.category || '',
    createdAt: o.created_at,
    updatedAt: o.updated_at
  };
}

// Public — a storefront customer placing an order at checkout (no auth).
r.post('/checkout', async (req, res, next) => {
  try {
    const d = req.body?.order || req.body || {};
    if (!d.customerName) return res.status(400).json({ error: 'Customer name is required' });
    const items = await enrichOrderItems(Array.isArray(d.items) ? d.items : []);
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    // Compute money server-side; never trust the client total or discount.
    const sub = items.reduce((a, it) => a + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    let discount = 0;
    let couponId = null;
    const couponCode = (d.couponCode || d.coupon || '').trim();
    if (couponCode) {
      try {
        const coupon = await validateCoupon(couponCode, sub);
        discount = coupon.discount;
        couponId = coupon.id;
      } catch (e) {
        return res.status(e.status || 400).json({ error: e.message || 'Invalid coupon' });
      }
    }
    const shipping = Number(d.shipping) || 0;
    const tax = Number(d.tax) || 0;
    const total = Math.max(0, sub - discount + tax + shipping);

    const method = d.paymentMethod === 'Bank Transfer' ? 'Bank Transfer' : 'COD';
    const id = 'ARS-' + Date.now();
    const category = items[0]?.category || '';
    const timeline = [{ status: 'Placed', at: new Date().toISOString(), note: 'Order received' }];

    const inserted = await queryOne(
      `INSERT INTO orders (id,customer_name,customer_phone,city,items,subtotal,discount,tax,shipping,total,payment_method,payment_status,delivery_status,tracking,courier,est_delivery,timeline,assigned_staff,notes,category,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Pending','Placed','','',NULL,$12,'',$13,$14,NOW(),NOW())
       RETURNING *`,
      [id, d.customerName, d.customerPhone || '', d.city || '', JSON.stringify(items),
       sub, discount, tax, shipping, total, method, JSON.stringify(timeline), d.notes || '', category]
    );

    // Upsert a customer record so the buyer is reflected in dashboards.
    try {
      const phone = (d.customerPhone || '').trim();
      const email = (d.email || '').trim();
      let existing = null;
      if (phone) existing = await queryOne('SELECT * FROM customers WHERE phone = $1 LIMIT 1', [phone]);
      if (!existing && email) existing = await queryOne('SELECT * FROM customers WHERE lower(email) = lower($1) LIMIT 1', [email]);
      if (existing) {
        await query(
          `UPDATE customers SET orders = orders + 1, total_spend = total_spend + $1, last_activity = CURRENT_DATE,
             type = CASE WHEN type = 'New' THEN 'Active' ELSE type END WHERE id = $2`,
          [total, existing.id]
        );
      } else {
        await query(
          `INSERT INTO customers (id,name,email,phone,city,address,orders,total_spend,payment_status,type,tags,notes,created_at,last_activity,active)
           VALUES ($1,$2,$3,$4,$5,$6,1,$7,'Pending','New','','',CURRENT_DATE,CURRENT_DATE,true)`,
          ['C-' + Date.now(), d.customerName, email, phone, d.city || '', d.address || '', total]
        );
      }
    } catch { /* customer upsert is best-effort; never block the order */ }

    if (couponId) await incrementCouponUse(couponId);

    const saved = fromRow(inserted);
    logAudit(req, { action: 'order.checkout', entity: 'order', entityId: id, orderId: id, after: { customerName: d.customerName, total, couponCode: couponCode || null }, note: 'Customer placed order at checkout' }).catch(() => {});

    // Notifications
    notifyCustomerByPhone(d.customerPhone || '', {
      title: `Order ${id} placed`,
      body: `Your order total is Rs. ${total.toLocaleString()}. We will update you when it ships.`,
      link: `/track/${id}`
    }).catch(() => {});
    notifyVendorsForOrder(id, items).catch(() => {});

    res.json({ order: saved });
  } catch (e) { next(e); }
});

// Public — a customer tracking their order by ID (customer-safe fields only).
r.get('/track/:id', async (req, res, next) => {
  try {
    const o = await queryOne('SELECT * FROM orders WHERE id = $1', [req.params.id.trim()]);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json({
      order: {
        id: o.id,
        customerName: o.customer_name,
        city: o.city,
        items: Array.isArray(o.items) ? o.items : [],
        total: Number(o.total),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        deliveryStatus: o.delivery_status,
        tracking: o.tracking || '',
        courier: o.courier || '',
        estDelivery: o.est_delivery || null,
        timeline: Array.isArray(o.timeline) ? o.timeline : [],
        createdAt: o.created_at,
        updatedAt: o.updated_at
      }
    });
  } catch (e) { next(e); }
});

r.get('/', requireAuth, requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, payStatus, staff, from, to, search } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const vals = []; let i = 1;
    if (status)    { sql += ` AND delivery_status = $${i++}`;           vals.push(status); }
    if (payStatus) { sql += ` AND payment_status = $${i++}`;            vals.push(payStatus); }
    if (staff)     { sql += ` AND assigned_staff = $${i++}`;            vals.push(staff); }
    if (from)      { sql += ` AND created_at >= $${i++}`;               vals.push(from); }
    if (to)        { sql += ` AND created_at <= $${i++}`;               vals.push(to); }
    if (search)    { sql += ` AND (id ILIKE $${i} OR customer_name ILIKE $${i})`; vals.push('%' + search + '%'); i++; }
    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, vals);
    res.json({ orders: rows.map(fromRow) });
  } catch (e) { next(e); }
});

r.get('/:id', requireAuth, requirePermission('orders'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: fromRow(row) });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('orders'), async (req, res, next) => {
  try {
    const d = req.body?.order || req.body || {};
    if (!d.customerName) return res.status(400).json({ error: 'Customer name is required' });
    const items = Array.isArray(d.items) ? d.items : [];
    const sub = items.reduce((a, it) => a + (it.price || 0) * (it.qty || 1), 0);
    const total = sub - (Number(d.discount) || 0) + (Number(d.tax) || 0) + (Number(d.shipping) || 0);
    const id = d.id || ('ARS-' + Date.now());
    await query(
      `INSERT INTO orders (id,customer_name,customer_phone,city,items,subtotal,discount,tax,shipping,total,payment_method,payment_status,delivery_status,tracking,assigned_staff,notes,category,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())`,
      [id, d.customerName, d.customerPhone||'', d.city||'', JSON.stringify(items),
       d.subtotal||sub, Number(d.discount)||0, Number(d.tax)||0, Number(d.shipping)||0, d.total||total,
       d.paymentMethod||'COD', d.paymentStatus||'Pending', d.deliveryStatus||'Processing',
       d.tracking||'', d.assignedStaff||'', d.notes||'', d.category||'']
    );
    const saved = fromRow(await queryOne('SELECT * FROM orders WHERE id = $1', [id]));
    logAudit(req, { action: 'order.create', entity: 'order', entityId: id, after: { customerName: d.customerName, total: saved.total }, note: 'Created order' });
    res.json({ order: saved });
  } catch (e) { next(e); }
});

r.put('/:id', requireAuth, requirePermission('orders'), async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    const d = req.body?.order || req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };
    if (d.customerName    !== undefined) add('customer_name',    d.customerName);
    if (d.customerPhone   !== undefined) add('customer_phone',   d.customerPhone);
    if (d.city            !== undefined) add('city',             d.city);
    if (d.items           !== undefined) add('items',            JSON.stringify(d.items));
    if (d.subtotal        !== undefined) add('subtotal',         Number(d.subtotal));
    if (d.discount        !== undefined) add('discount',         Number(d.discount));
    if (d.tax             !== undefined) add('tax',              Number(d.tax));
    if (d.shipping        !== undefined) add('shipping',         Number(d.shipping));
    if (d.total           !== undefined) add('total',            Number(d.total));
    if (d.paymentMethod   !== undefined) add('payment_method',   d.paymentMethod);
    if (d.paymentStatus   !== undefined) add('payment_status',   d.paymentStatus);
    if (d.deliveryStatus  !== undefined) add('delivery_status',  d.deliveryStatus);
    if (d.tracking        !== undefined) add('tracking',         d.tracking);
    if (d.courier         !== undefined) add('courier',          d.courier);
    if (d.estDelivery     !== undefined) add('est_delivery',     d.estDelivery || null);
    if (d.assignedStaff   !== undefined) add('assigned_staff',   d.assignedStaff);
    if (d.notes           !== undefined) add('notes',            d.notes);

    // Append a dated timeline entry whenever the delivery status actually changes, so the
    // customer-facing tracking page shows a real history (PriceOye-style).
    if (d.deliveryStatus !== undefined && d.deliveryStatus !== existing.delivery_status) {
      const prev = Array.isArray(existing.timeline) ? existing.timeline : [];
      const entry = { status: d.deliveryStatus, at: new Date().toISOString(), note: (d.statusNote || '').trim() };
      add('timeline', JSON.stringify([...prev, entry]));

      // Count units sold when an order is first marked delivered.
      if (d.deliveryStatus === 'Delivered' && existing.delivery_status !== 'Delivered') {
        const items = Array.isArray(existing.items) ? existing.items : [];
        for (const it of items) {
          const pid = String(it.sku || it.id || '');
          const qty = Number(it.qty) || 1;
          if (pid) {
            await query(
              'UPDATE products SET sold = sold + $1, stock = GREATEST(0, stock - $1) WHERE id = $2',
              [qty, pid]
            );
          }
        }
      }
    }

    if (!sets.length) return res.json({ order: fromRow(existing) });
    sets.push('updated_at = NOW()'); vals.push(req.params.id);
    const updated = fromRow(await queryOne(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals));
    logAudit(req, { action: 'order.update', entity: 'order', entityId: req.params.id, before: { deliveryStatus: existing.delivery_status, paymentStatus: existing.payment_status }, after: { deliveryStatus: updated.deliveryStatus, paymentStatus: updated.paymentStatus }, note: 'Updated order' });

    // Notify customer on status changes (accounts remain manual).
    if (d.deliveryStatus !== undefined && d.deliveryStatus !== existing.delivery_status) {
      notifyCustomerByPhone(existing.customer_phone, {
        title: `Order ${req.params.id} — ${d.deliveryStatus}`,
        body: d.statusNote || `Your order status is now: ${d.deliveryStatus}.`,
        link: `/track/${req.params.id}`
      }).catch(() => {});
    }
    if (d.paymentStatus !== undefined && d.paymentStatus !== existing.payment_status) {
      notifyCustomerByPhone(existing.customer_phone, {
        title: `Payment update — ${req.params.id}`,
        body: `Payment status: ${d.paymentStatus}.`,
        link: `/track/${req.params.id}`
      }).catch(() => {});
    }

    const fullOrder = await queryOne('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    syncOrderAccounts(fullOrder).catch((e) => console.warn('[accounts] sync failed:', e.message));

    res.json({ order: updated });
  } catch (e) { next(e); }
});

r.delete('/:id', requireAuth, requirePermission('orders'), async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT id, customer_name FROM orders WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    await query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    logAudit(req, { action: 'order.delete', entity: 'order', entityId: req.params.id, before: { customerName: existing.customer_name }, note: 'Deleted order' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
