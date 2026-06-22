// Builds the initial database the first time the server runs.
// Admin users + permissions are imported from the SAME files the frontend
// uses, so the backend can never drift out of sync with the UI.
import bcrypt from 'bcryptjs';
import { ROLE_PRESETS } from '../../src/utils/permissions.js';
import { products as seedProducts } from '../../src/data/products.js';

// Default demo passwords (change in production). Keyed by email.
const DEFAULT_PASSWORDS = {
  'alrafiqshopping56@gmail.com': 'alrafiq123',
  'products@alrafiq.pk': 'products123',
  'support@alrafiq.pk': 'support123',
  'accounts@alrafiq.pk': 'accounts123'
};

function adminSeed() {
  const base = [
    { id: 'u-exec',     name: 'Store Owner',     email: 'Alrafiqshopping56@gmail.com', role: 'Executive',       department: 'Management' },
    { id: 'u-products', name: 'Imran (Catalog)', email: 'products@alrafiq.pk',         role: 'Product Manager', department: 'Catalog' },
    { id: 'u-support',  name: 'Ayesha (Support)',email: 'support@alrafiq.pk',          role: 'Support Agent',   department: 'Customer Care' },
    { id: 'u-accounts', name: 'Usman (Accounts)',email: 'accounts@alrafiq.pk',         role: 'Accountant',      department: 'Finance' }
  ];
  return base.map((u) => {
    const pwd = DEFAULT_PASSWORDS[u.email.toLowerCase()] || 'changeme123';
    const preset = ROLE_PRESETS[u.role] || ROLE_PRESETS.Custom;
    return {
      ...u,
      passwordHash: bcrypt.hashSync(pwd, 8),
      permissions: [...preset.permissions],
      status: 'active',
      createdAt: '2026-01-01',
      lastLogin: null
    };
  });
}

// Backend product mirror used for import duplicate-detection and exports.
// Adds cost price / SKU / supplier fields that the storefront seed lacks.
function productSeed() {
  return seedProducts.map((p, i) => ({
    id: p.id,
    sku: 'ARS-' + String(1000 + i),
    title: p.title,
    slug: p.slug,
    category: p.category,
    brand: p.brand || 'Maxx',
    price: p.price,
    mrp: p.mrp || p.price,
    costPrice: Math.round((p.price || 0) * 0.7),
    stock: p.stock ?? 0,
    sold: p.sold ?? 0,
    supplier: '',
    images: p.images || [],
    short: p.short || '',
    description: p.description || '',
    specs: p.specs || {},
    tags: p.tags || [],
    variants: p.variants || [],
    status: 'active',
    source: 'seed',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  }));
}

function customerSeed() {
  return [
    { id: 'C-001', name: 'Ayesha Khan',   email: 'ayesha@example.com', phone: '+92 300 1234567', city: 'Lahore',     address: 'House 12, Model Town, Lahore',     orders: 12, totalSpend: 56400, paymentStatus: 'Paid',    type: 'VIP',    tags: 'loyal,wholesale', notes: 'Prefers COD', createdAt: '2024-08-12', lastActivity: '2026-05-17', active: true },
    { id: 'C-002', name: 'Hamza Riaz',    email: 'hamza@example.com',  phone: '+92 312 9876543', city: 'Islamabad',  address: 'Flat 4B, F-11 Markaz, Islamabad',   orders: 7,  totalSpend: 32100, paymentStatus: 'Paid',    type: 'Active', tags: 'electronics',     notes: '', createdAt: '2024-11-03', lastActivity: '2026-05-17', active: true },
    { id: 'C-003', name: 'Sana Tariq',    email: 'sana.t@example.com', phone: '+92 333 1112233', city: 'Karachi',    address: 'Bungalow 9, DHA Phase 6, Karachi',  orders: 4,  totalSpend: 12300, paymentStatus: 'Pending', type: 'Active', tags: '',                notes: 'Bank transfer customer', createdAt: '2025-01-19', lastActivity: '2026-05-16', active: true },
    { id: 'C-004', name: 'Bilal Ahmed',   email: 'bilal@example.com',  phone: '+92 311 2223344', city: 'Faisalabad', address: 'Street 3, Jaranwala Rd, Faisalabad',orders: 9,  totalSpend: 44120, paymentStatus: 'Paid',    type: 'Active', tags: 'kitchen',         notes: '', createdAt: '2024-06-22', lastActivity: '2026-05-16', active: true },
    { id: 'C-005', name: 'Mariam Yousaf', email: 'mariam@example.com', phone: '+92 345 4445566', city: 'Multan',     address: 'House 77, Gulgasht, Multan',        orders: 2,  totalSpend: 5980,  paymentStatus: 'Paid',    type: 'New',    tags: '',                notes: '', createdAt: '2025-04-02', lastActivity: '2026-04-30', active: false }
  ];
}

function orderSeed() {
  const mk = (id, cust, phone, city, items, discount, tax, shipping, payment, payStatus, delivery, tracking, staff, notes, created) => {
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    return { id, customerName: cust, customerPhone: phone, city, items, subtotal, discount, tax, shipping,
      total: subtotal - discount + tax + shipping, paymentMethod: payment, paymentStatus: payStatus,
      deliveryStatus: delivery, tracking, assignedStaff: staff, notes, category: items[0]?.category || '',
      createdAt: created, updatedAt: created };
  };
  return [
    mk('ARS-1029', 'Ayesha Khan',   '+92 300 1234567', 'Lahore',     [{ sku: 'ARS-1000', name: 'National Deluxe Blender', qty: 1, price: 6499, category: 'kitchen-appliances' }], 500, 0, 0, 'COD', 'Pending', 'Processing', '', 'Imran (Catalog)', 'Call before delivery', '2026-05-17'),
    mk('ARS-1028', 'Hamza Riaz',    '+92 312 9876543', 'Islamabad',  [{ sku: 'ARS-1003', name: 'Royal Bone China Dinner Set', qty: 1, price: 18999, category: 'crockery' }], 0, 0, 0, 'Bank Transfer', 'Paid', 'Delivered', 'TRK-552190', 'Ayesha (Support)', '', '2026-05-17'),
    mk('ARS-1027', 'Sana Tariq',    '+92 333 1112233', 'Karachi',    [{ sku: 'ARS-1006', name: 'Wireless Earbuds Pro', qty: 1, price: 4499, category: 'electronics' }, { sku: 'ARS-1004', name: 'Glass Tumbler Set', qty: 2, price: 1499, category: 'crockery' }], 0, 0, 0, 'Bank Transfer', 'Pending', 'In Transit', 'TRK-552188', 'Ayesha (Support)', '', '2026-05-16'),
    mk('ARS-1026', 'Bilal Ahmed',   '+92 311 2223344', 'Faisalabad', [{ sku: 'ARS-1002', name: 'Anex Sandwich Maker', qty: 1, price: 3499, category: 'kitchen-appliances' }], 0, 0, 300, 'COD', 'Paid', 'Delivered', 'TRK-552180', 'Imran (Catalog)', 'Allow-to-open delivery', '2026-05-16'),
    mk('ARS-1025', 'Mariam Yousaf', '+92 345 4445566', 'Multan',     [{ sku: 'ARS-1001', name: 'Philips Electric Kettle', qty: 1, price: 4299, category: 'kitchen-appliances' }], 0, 0, 0, 'COD', 'Refunded', 'Cancelled', '', 'Usman (Accounts)', 'Customer cancelled', '2026-05-15')
  ];
}

export function buildSeed() {
  return {
    adminUsers: adminSeed(),
    products: productSeed(),
    customers: customerSeed(),
    orders: orderSeed(),
    mediaLibrary: [],
    auditLog: [],
    importLog: [],
    exportLog: [],
    settings: {
      import: { enabled: true, allowedUserIds: [] }, // executives always allowed
      uploads: { maxFileMB: 5, maxTotalMB: 25, requireApproval: false, watermark: false }
    }
  };
}
