import { randomUUID } from 'crypto';
import { query } from '../db/pg.js';
import { sendPushToUser } from './fcm.js';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userType: row.user_type,
    userId: row.user_id,
    title: row.title,
    body: row.body || '',
    link: row.link || '',
    read: !!row.read,
    createdAt: row.created_at
  };
}

export async function createNotification({ userType, userId, title, body = '', link = '' }) {
  if (!userType || !userId || !title) return null;
  const id = 'ntf-' + randomUUID();
  await query(
    `INSERT INTO notifications (id, user_type, user_id, title, body, link, read, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,false,NOW())`,
    [id, userType, String(userId), title, body, link || '']
  );
  const row = fromRow({ id, user_type: userType, user_id: userId, title, body, link, read: false, created_at: new Date() });
  sendPushToUser(userType, userId, { title, body, link, notificationId: id }).catch(() => {});
  return row;
}

export async function listNotifications(userType, userId, { limit = 50 } = {}) {
  const rows = await query(
    `SELECT * FROM notifications WHERE user_type = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [userType, String(userId), Math.min(100, limit)]
  );
  return rows.map(fromRow);
}

export async function unreadCount(userType, userId) {
  const row = await query(
    `SELECT COUNT(*)::int AS n FROM notifications
     WHERE user_type = $1 AND user_id = $2 AND read = false`,
    [userType, String(userId)]
  );
  return row[0]?.n ?? 0;
}

export async function markNotificationRead(id, userType, userId) {
  await query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_type = $2 AND user_id = $3`,
    [id, userType, String(userId)]
  );
}

export async function markAllRead(userType, userId) {
  await query(
    `UPDATE notifications SET read = true WHERE user_type = $1 AND user_id = $2 AND read = false`,
    [userType, String(userId)]
  );
}

/** Notify customer by phone lookup (guest checkout) or customer id. */
export async function notifyCustomerByPhone(phone, payload) {
  const p = (phone || '').trim();
  if (!p) return null;
  const c = await query(
    `SELECT id FROM customers WHERE phone = $1 AND active = true ORDER BY last_activity DESC NULLS LAST LIMIT 1`,
    [p]
  );
  if (!c[0]?.id) return null;
  return createNotification({ userType: 'customer', userId: c[0].id, ...payload });
}

/** Notify all vendors who have products in an order. */
export async function notifyVendorsForOrder(orderId, items = []) {
  const vendorIds = [...new Set((items || []).map((it) => it.vendorId).filter(Boolean))];
  for (const vid of vendorIds) {
    await createNotification({
      userType: 'vendor',
      userId: vid,
      title: `New order ${orderId}`,
      body: 'A customer placed an order containing your products. Manage shipping and payment in your vendor portal.',
      link: '/vendor/orders'
    });
  }
}
