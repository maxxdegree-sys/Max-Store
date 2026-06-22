import { Router } from 'express';
import { requireCustomer } from '../auth.js';
import { requireAuth } from '../auth.js';
import { listNotifications, markNotificationRead, markAllRead, unreadCount } from '../services/notifications.js';
import jwt from 'jsonwebtoken';

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'al-rafiq-dev-secret-change-me';

async function requireVendorFromToken(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isVendor) return res.status(403).json({ error: 'Vendor access only.' });
    req.vendorId = decoded.vendorId;
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired.' });
    }
    next(e);
  }
}

// Customer notifications
r.get('/customer', requireCustomer, async (req, res, next) => {
  try {
    const notifications = await listNotifications('customer', req.customer.id);
    const unread = await unreadCount('customer', req.customer.id);
    res.json({ notifications, unread });
  } catch (e) { next(e); }
});

r.patch('/customer/:id/read', requireCustomer, async (req, res, next) => {
  try {
    await markNotificationRead(req.params.id, 'customer', req.customer.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.post('/customer/read-all', requireCustomer, async (req, res, next) => {
  try {
    await markAllRead('customer', req.customer.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Vendor notifications
r.get('/vendor', requireVendorFromToken, async (req, res, next) => {
  try {
    const notifications = await listNotifications('vendor', req.vendorId);
    const unread = await unreadCount('vendor', req.vendorId);
    res.json({ notifications, unread });
  } catch (e) { next(e); }
});

r.patch('/vendor/:id/read', requireVendorFromToken, async (req, res, next) => {
  try {
    await markNotificationRead(req.params.id, 'vendor', req.vendorId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.post('/vendor/read-all', requireVendorFromToken, async (req, res, next) => {
  try {
    await markAllRead('vendor', req.vendorId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Admin notifications (staff inbox for order alerts, etc.)
r.get('/admin', requireAuth, async (req, res, next) => {
  try {
    const notifications = await listNotifications('admin', req.user.id);
    const unread = await unreadCount('admin', req.user.id);
    res.json({ notifications, unread });
  } catch (e) { next(e); }
});

export default r;
