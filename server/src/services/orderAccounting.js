import { query, queryOne } from '../db/pg.js';

const SHIPPED_STATUSES = new Set(['In Transit', 'Delivered']);
const VOID_DELIVERY = new Set(['Cancelled', 'Returned']);
const VOID_PAYMENT = new Set(['Refunded', 'Failed']);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function productAmount(order) {
  return Math.max(
    0,
    Math.round((Number(order.subtotal) - Number(order.discount) + Number(order.tax)) * 100) / 100
  );
}

function totalCommission(items = []) {
  return (items || []).reduce((s, it) => s + (Number(it.commissionAmount) || 0), 0);
}

function shouldVoid(order) {
  return VOID_DELIVERY.has(order.delivery_status) || VOID_PAYMENT.has(order.payment_status);
}

async function upsertTransaction({ id, type, category, description, amount, date, method, status, reference }) {
  const amt = Math.max(0, Math.round(Number(amount) * 100) / 100);
  const row = await queryOne('SELECT id FROM transactions WHERE id = $1', [id]);
  const vals = [type, category, description, amt, date || today(), method || 'COD', status, reference || ''];
  if (row) {
    await query(
      `UPDATE transactions SET type=$2, category=$3, description=$4, amount=$5, date=$6, method=$7, status=$8, reference=$9
       WHERE id=$1`,
      [id, ...vals]
    );
  } else {
    await query(
      `INSERT INTO transactions (id,type,category,description,amount,date,method,status,reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, ...vals]
    );
  }
}

async function removeAutoTransactions(orderId) {
  await query(
    `DELETE FROM transactions WHERE reference = $1 AND id LIKE $2`,
    [orderId, `t-order-${orderId}-%`]
  );
}

/**
 * Sync ledger entries for an order.
 * Posts cleared income (+ platform commission expense) when payment is Paid AND order is shipped.
 * Removes auto entries on cancel/refund.
 */
export async function syncOrderAccounts(order) {
  if (!order?.id) return { synced: false, reason: 'no-order' };

  const orderId = order.id;
  const prefix = `t-order-${orderId}`;
  const method = order.payment_method || 'COD';
  const items = Array.isArray(order.items)
    ? order.items
    : (typeof order.items === 'string' ? JSON.parse(order.items || '[]') : []);

  if (shouldVoid(order)) {
    await removeAutoTransactions(orderId);
    return { synced: true, action: 'voided' };
  }

  const paid = order.payment_status === 'Paid';
  const shipped = SHIPPED_STATUSES.has(order.delivery_status);

  if (!paid || !shipped) {
    await removeAutoTransactions(orderId);
    return { synced: true, action: 'waiting', paid, shipped };
  }

  const sales = productAmount(order);
  const shipping = Math.max(0, Number(order.shipping) || 0);
  const commission = Math.round(totalCommission(items) * 100) / 100;
  const desc = `Order ${orderId}${order.customer_name ? ` (${order.customer_name})` : ''}`;

  await upsertTransaction({
    id: `${prefix}-sales`,
    type: 'income',
    category: 'Product Sales',
    description: desc,
    amount: sales,
    method,
    status: 'cleared',
    reference: orderId
  });

  if (shipping > 0) {
    await upsertTransaction({
      id: `${prefix}-shipping`,
      type: 'income',
      category: 'Shipping Collected',
      description: `Shipping — ${orderId}`,
      amount: shipping,
      method,
      status: 'cleared',
      reference: orderId
    });
  } else {
    await query('DELETE FROM transactions WHERE id = $1', [`${prefix}-shipping`]).catch(() => {});
  }

  if (commission > 0) {
    await upsertTransaction({
      id: `${prefix}-commission`,
      type: 'expense',
      category: 'Platform Commission',
      description: `Marketplace commission — ${orderId}`,
      amount: commission,
      method: 'Bank Transfer',
      status: 'cleared',
      reference: orderId
    });
  } else {
    await query('DELETE FROM transactions WHERE id = $1', [`${prefix}-commission`]).catch(() => {});
  }

  return { synced: true, action: 'posted', sales, shipping, commission };
}
