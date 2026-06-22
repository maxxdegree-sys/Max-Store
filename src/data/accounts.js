// Accounts / finance seed data for the back office.
// type: 'income' | 'expense'
// method: 'COD' | 'Bank Transfer' | 'Cash' | 'JazzCash' | 'Easypaisa'
// status: 'cleared' | 'pending'   (pending income = receivable, e.g. COD in transit)
export const INCOME_CATEGORIES = ['Product Sales', 'Shipping Collected', 'Vendor Sales', 'Other Income'];
export const EXPENSE_CATEGORIES = [
  'Inventory Purchase', 'Salaries', 'Rent', 'Utilities',
  'Marketing', 'Courier / Shipping', 'Packaging', 'Platform Commission', 'Vendor Payout', 'Misc'
];

export const transactions = [
  { id: 't1',  type: 'income',  category: 'Product Sales',      description: 'Order ARS-1028 (Bone China set)', amount: 18999, date: '2026-05-17', method: 'Bank Transfer', status: 'cleared', reference: 'ARS-1028' },
  { id: 't2',  type: 'income',  category: 'Product Sales',      description: 'Order ARS-1024 (COD - in transit)', amount: 14299, date: '2026-05-17', method: 'COD',          status: 'pending', reference: 'ARS-1024' },
  { id: 't3',  type: 'income',  category: 'Product Sales',      description: 'Order ARS-1026',                  amount: 4499,  date: '2026-05-16', method: 'COD',          status: 'cleared', reference: 'ARS-1026' },
  { id: 't4',  type: 'income',  category: 'Shipping Collected', description: 'Allow-to-open fees (week)',        amount: 2400,  date: '2026-05-16', method: 'COD',          status: 'cleared', reference: '' },
  { id: 't5',  type: 'expense', category: 'Inventory Purchase', description: 'Kitchen appliances restock',       amount: 62000, date: '2026-05-12', method: 'Bank Transfer', status: 'cleared', reference: 'PO-330' },
  { id: 't6',  type: 'expense', category: 'Salaries',           description: 'Staff salaries (May, partial)',    amount: 85000, date: '2026-05-01', method: 'Bank Transfer', status: 'cleared', reference: '' },
  { id: 't7',  type: 'expense', category: 'Rent',               description: 'Shop rent - Main Bazar',           amount: 45000, date: '2026-05-01', method: 'Cash',          status: 'cleared', reference: '' },
  { id: 't8',  type: 'expense', category: 'Courier / Shipping', description: 'M&P courier settlement',           amount: 9800,  date: '2026-05-14', method: 'Bank Transfer', status: 'cleared', reference: '' },
  { id: 't9',  type: 'expense', category: 'Marketing',          description: 'Facebook + Instagram ads',         amount: 15000, date: '2026-05-10', method: 'JazzCash',      status: 'cleared', reference: '' },
  { id: 't10', type: 'expense', category: 'Packaging',          description: 'Boxes, bubble wrap, tape',         amount: 6200,  date: '2026-05-08', method: 'Cash',          status: 'cleared', reference: '' },
  { id: 't11', type: 'expense', category: 'Utilities',          description: 'Electricity + internet',           amount: 11500, date: '2026-05-05', method: 'Cash',          status: 'cleared', reference: '' },
  { id: 't12', type: 'income',  category: 'Product Sales',      description: 'Order ARS-1027 (COD pending)',     amount: 9499,  date: '2026-05-16', method: 'COD',          status: 'pending', reference: 'ARS-1027' }
];
