// Shared order-status vocabulary used by the admin editor (AdminOrders) and the public
// tracking page (OrderTracking). Keeping it here prevents the two from drifting apart.

// Canonical statuses an admin can set, in lifecycle order. `Cancelled` is terminal.
export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

// Map any stored status (including legacy values like "Processing" / "In Transit") to a
// stepper stage index 0..4. Unknown statuses fall back to stage 0 (Placed).
const STATUS_TO_STAGE = {
  'placed': 0, 'order placed': 0,
  'confirmed': 1, 'processing': 1, 'packed': 1, 'ready to ship': 1,
  'shipped': 2, 'dispatched': 2, 'in transit': 2,
  'out for delivery': 3,
  'delivered': 4
};

export const stageIndex = (status) => STATUS_TO_STAGE[(status || '').toLowerCase()] ?? 0;
export const isCancelled = (status) => (status || '').toLowerCase() === 'cancelled';

// Badge colours, shared by admin and customer order tables.
export const statusColor = {
  Placed:             'bg-ink-100 text-ink-700 ring-ink-200',
  Confirmed:          'bg-amber-50 text-amber-700 ring-amber-200',
  Processing:         'bg-amber-50 text-amber-700 ring-amber-200',
  Packed:             'bg-violet-50 text-violet-700 ring-violet-200',
  Shipped:            'bg-sky-50 text-sky-700 ring-sky-200',
  'In Transit':       'bg-sky-50 text-sky-700 ring-sky-200',
  'Out for Delivery': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Delivered:          'bg-brand-50 text-brand-700 ring-brand-200',
  Cancelled:          'bg-rose-50 text-rose-700 ring-rose-200'
};
