import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { isExecutive } from '../../../src/utils/permissions.js';
import { query } from '../db/pg.js';
import { logAudit } from '../audit.js';
import { toCsv, toXlsx, toPdf } from '../util/exporters.js';

const r = Router();
const PERM = { customers: 'customers', orders: 'orders', products: 'products' };

function columnsFor(entity, exec) {
  if (entity === 'customers') return [
    { key: 'id', header: 'Customer ID', width: 14 }, { key: 'name', header: 'Full Name', width: 22 },
    { key: 'phone', header: 'Phone', width: 18 }, { key: 'email', header: 'Email', width: 24 },
    { key: 'address', header: 'Address', width: 30 }, { key: 'city', header: 'City', width: 14 },
    { key: 'orders', header: 'Orders', width: 10 }, { key: 'totalSpend', header: 'Total Purchases', width: 16 },
    { key: 'paymentStatus', header: 'Payment Status', width: 14 }, { key: 'createdAt', header: 'Created', width: 14 },
    { key: 'lastActivity', header: 'Last Activity', width: 14 }, { key: 'tags', header: 'Tags / Notes', width: 22 }
  ];
  if (entity === 'orders') return [
    { key: 'id', header: 'Order ID', width: 14 }, { key: 'customerName', header: 'Customer', width: 20 }, { key: 'customerPhone', header: 'Phone', width: 16 },
    { key: 'itemsText', header: 'Products', width: 34 }, { key: 'sku', header: 'SKU', width: 16 }, { key: 'qty', header: 'Qty', width: 8 },
    { key: 'subtotal', header: 'Price', width: 12 }, { key: 'discount', header: 'Discount', width: 10 }, { key: 'tax', header: 'Tax', width: 8 },
    { key: 'shipping', header: 'Shipping', width: 10 }, { key: 'total', header: 'Total', width: 12 },
    { key: 'paymentMethod', header: 'Payment', width: 14 }, { key: 'paymentStatus', header: 'Pay Status', width: 12 },
    { key: 'deliveryStatus', header: 'Delivery', width: 12 }, { key: 'tracking', header: 'Tracking', width: 14 },
    { key: 'assignedStaff', header: 'Assigned Staff', width: 18 }, { key: 'notes', header: 'Notes', width: 20 },
    { key: 'createdAt', header: 'Created', width: 12 }, { key: 'updatedAt', header: 'Updated', width: 12 }
  ];
  const base = [
    { key: 'id', header: 'Product ID', width: 12 }, { key: 'title', header: 'Name', width: 30 }, { key: 'sku', header: 'SKU', width: 14 },
    { key: 'category', header: 'Category', width: 18 }, { key: 'brand', header: 'Brand', width: 14 },
    { key: 'price', header: 'Sale Price', width: 12 }, { key: 'mrp', header: 'MRP', width: 12 },
    { key: 'stock', header: 'Stock', width: 10 }, { key: 'supplier', header: 'Supplier', width: 18 },
    { key: 'imagesText', header: 'Image URLs', width: 30 }, { key: 'status', header: 'Status', width: 12 },
    { key: 'createdAt', header: 'Added', width: 12 }, { key: 'updatedAt', header: 'Updated', width: 12 }
  ];
  const fin = [{ key: 'costPrice', header: 'Cost Price', width: 12 }, { key: 'margin', header: 'Profit Margin %', width: 14 }];
  return exec ? [...base.slice(0, 7), ...fin, ...base.slice(7)] : base;
}

async function rowsFor(entity, q) {
  if (entity === 'customers') {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const vals = [];
    let i = 1;
    if (q.city)            { sql += ` AND lower(city) = lower($${i++})`;      vals.push(q.city); }
    if (q.type)            { sql += ` AND type = $${i++}`;                    vals.push(q.type); }
    if (q.active === 'true')  { sql += ` AND active = true`; }
    if (q.active === 'false') { sql += ` AND active = false`; }
    if (q.from)            { sql += ` AND created_at >= $${i++}`;             vals.push(q.from); }
    if (q.to)              { sql += ` AND created_at <= $${i++}`;             vals.push(q.to); }
    if (q.id)              { sql += ` AND id = $${i++}`;                      vals.push(q.id); }
    const rows = await query(sql, vals);
    return rows.map((c) => ({
      id: c.id, name: c.name, phone: c.phone, email: c.email,
      address: c.address, city: c.city, orders: c.orders,
      totalSpend: Number(c.total_spend), paymentStatus: c.payment_status,
      createdAt: c.created_at, lastActivity: c.last_activity,
      tags: [c.tags, c.notes].filter(Boolean).join(' | ')
    }));
  }
  if (entity === 'orders') {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const vals = [];
    let i = 1;
    if (q.deliveryStatus) { sql += ` AND delivery_status = $${i++}`;  vals.push(q.deliveryStatus); }
    if (q.paymentStatus)  { sql += ` AND payment_status = $${i++}`;   vals.push(q.paymentStatus); }
    if (q.staff)          { sql += ` AND assigned_staff = $${i++}`;   vals.push(q.staff); }
    if (q.category)       { sql += ` AND category = $${i++}`;         vals.push(q.category); }
    if (q.from)           { sql += ` AND created_at >= $${i++}`;      vals.push(q.from); }
    if (q.to)             { sql += ` AND created_at <= $${i++}`;      vals.push(q.to); }
    if (q.id)             { sql += ` AND id = $${i++}`;               vals.push(q.id); }
    const rows = await query(sql, vals);
    return rows.map((o) => ({
      id: o.id, customerName: o.customer_name, customerPhone: o.customer_phone,
      subtotal: Number(o.subtotal), discount: Number(o.discount), tax: Number(o.tax),
      shipping: Number(o.shipping), total: Number(o.total),
      paymentMethod: o.payment_method, paymentStatus: o.payment_status,
      deliveryStatus: o.delivery_status, tracking: o.tracking,
      assignedStaff: o.assigned_staff, notes: o.notes,
      createdAt: o.created_at, updatedAt: o.updated_at,
      itemsText: (o.items || []).map((it) => it.qty + 'x ' + it.name).join('; '),
      sku: (o.items || []).map((it) => it.sku).join(', '),
      qty: (o.items || []).reduce((a, it) => a + it.qty, 0)
    }));
  }
  // products
  let sql = 'SELECT * FROM products WHERE 1=1';
  const vals = [];
  let i = 1;
  if (q.category)           { sql += ` AND category = $${i++}`;                          vals.push(q.category); }
  if (q.brand)              { sql += ` AND lower(brand) = lower($${i++})`;                vals.push(q.brand); }
  if (q.supplier)           { sql += ` AND supplier = $${i++}`;                          vals.push(q.supplier); }
  if (q.lowStock === 'true'){ sql += ` AND stock < 10`; }
  if (q.minPrice)           { sql += ` AND price >= $${i++}`;                            vals.push(Number(q.minPrice)); }
  if (q.maxPrice)           { sql += ` AND price <= $${i++}`;                            vals.push(Number(q.maxPrice)); }
  const rows = await query(sql, vals);
  return rows.map((p) => ({
    id: p.id, title: p.title, sku: p.sku, category: p.category, brand: p.brand,
    price: Number(p.price), mrp: Number(p.mrp), costPrice: Number(p.cost_price),
    stock: p.stock, supplier: p.supplier, status: p.status,
    createdAt: p.created_at, updatedAt: p.updated_at,
    imagesText: (p.images || []).join(' | '),
    margin: Number(p.price) ? Math.round(((Number(p.price) - Number(p.cost_price)) / Number(p.price)) * 100) : 0
  }));
}

// GET /api/exports  -> export log
r.get('/', requireAuth, async (req, res, next) => {
  try {
    const exec = isExecutive(req.user.permissions || []);
    const sql = exec
      ? 'SELECT * FROM export_log ORDER BY at DESC LIMIT 200'
      : 'SELECT * FROM export_log WHERE user_id = $1 ORDER BY at DESC LIMIT 200';
    const rows = await query(sql, exec ? [] : [req.user.id]);
    res.json({ log: rows });
  } catch (e) { next(e); }
});

// GET /api/exports/:entity?format=csv|xlsx|pdf&...filters
r.get('/:entity',
  requireAuth,
  (req, res, next) => {
    const perm = PERM[req.params.entity];
    if (!perm) return res.status(404).json({ error: 'Unknown export type' });
    return requirePermission(perm)(req, res, next);
  },
  async (req, res) => {
    const entity = req.params.entity;
    const format = (req.query.format || 'csv').toLowerCase();
    const exec = isExecutive(req.user.permissions || []);
    const columns = columnsFor(entity, exec);
    const rows = await rowsFor(entity, req.query);
    const stamp = new Date().toISOString().slice(0, 10);
    const fname = 'maxx-' + entity + '-' + stamp;
    const meta = 'Generated by ' + req.user.name + ' (' + req.user.role + ') on ' + new Date().toLocaleString() + '  -  ' + rows.length + ' records  -  CONFIDENTIAL';
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();

    await query(
      `INSERT INTO export_log (id,at,user_id,user_name,role,entity,format,count,filters,ip)
       VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), req.user.id, req.user.name, req.user.role, entity, format, rows.length, JSON.stringify({ ...req.query, format: undefined }), ip]
    );
    logAudit(req, { action: 'export', entity, note: entity + ' (' + format + ', ' + rows.length + ' rows)' });

    try {
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fname + '.csv"');
        return res.send(toCsv(columns, rows));
      }
      if (format === 'xlsx') {
        const buf = await toXlsx(columns, rows, { sheet: entity });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fname + '.xlsx"');
        return res.send(buf);
      }
      if (format === 'pdf') {
        const buf = await toPdf(columns, rows, { title: 'Maxx - ' + entity.toUpperCase() + ' Export', meta });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fname + '.pdf"');
        return res.send(buf);
      }
      res.status(400).json({ error: 'Unknown format' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
);

export default r;
