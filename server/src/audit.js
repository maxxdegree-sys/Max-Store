import { randomUUID } from 'crypto';
import { query } from './db/pg.js';

export function clientInfo(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  return { ip, userAgent: req.headers['user-agent'] || '' };
}

export async function logAudit(req, { action, entity, entityId = null, before = null, after = null, ticketId = null, orderId = null, note = '' }) {
  const u = req.user || {};
  const { ip, userAgent } = clientInfo(req);
  const id = randomUUID();
  await query(
    `INSERT INTO audit_log (id,at,user_id,user_name,role,department,action,entity,entity_id,ticket_id,order_id,before_val,after_val,note,ip,user_agent)
     VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      id,
      u.id || null,
      u.name || 'system',
      u.role || '',
      u.department || '',
      action,
      entity || '',
      entityId,
      ticketId,
      orderId,
      before != null ? JSON.stringify(before) : null,
      after  != null ? JSON.stringify(after)  : null,
      note,
      ip,
      userAgent
    ]
  );
  return id;
}
