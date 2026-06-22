// Role-Based Access Control (RBAC) for the Maxx admin panel.
//
// Each admin section maps to a "permission key". A user can access a section
// only if their permissions array contains that key. The Executive role holds
// every permission, including "team" (manage users) and "activity" (audit log).
//
// In production, store each user's permissions array as Firebase Auth custom
// claims or a Firestore "adminUsers" doc, and read them on login. The shape
// here matches exactly so the swap is a drop-in.

export const PERMISSIONS = [
  { key: 'dashboard',  label: 'Dashboard & Analytics',  desc: 'View sales charts and KPIs' },
  { key: 'products',   label: 'Products',               desc: 'Add, edit, delete products & inventory' },
  { key: 'orders',     label: 'Orders',                 desc: 'View and manage customer orders' },
  { key: 'customers',  label: 'Customers',              desc: 'View customer list and details' },
  { key: 'banners',    label: 'Banners',                desc: 'Manage homepage banners' },
  { key: 'coupons',    label: 'Coupons',                desc: 'Create and manage discount codes' },
  { key: 'reviews',    label: 'Reviews',                desc: 'Moderate and import product reviews' },
  { key: 'complaints', label: 'Complaints',             desc: 'Handle customer complaint tickets' },
  { key: 'accounts',   label: 'Accounts & Finance',     desc: 'Income, expenses, P&L and receivables' },
  { key: 'exports',    label: 'Exports & Downloads',    desc: 'Download customer, order and product records' },
  { key: 'blog',       label: 'Blog & SEO',             desc: 'Manage blog posts, SEO and AI content tools' },
  { key: 'email',      label: 'Email Campaigns',        desc: 'Import contacts and send bulk email' },
  { key: 'vendors',    label: 'Vendors / Suppliers',    desc: 'Add and manage supplier companies (Samsung etc) and their portal access' },
  { key: 'team',       label: 'Team / Users',           desc: 'Add, remove and assign admin roles (Executive)' },
  { key: 'activity',   label: 'Activity Log',           desc: 'View login and action history (Executive)' }
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Role presets — picking a role auto-fills the permission set.
// "Custom" lets the executive tick individual boxes.
export const ROLE_PRESETS = {
  Executive: {
    label: 'Executive (Super Admin)',
    permissions: [...PERMISSION_KEYS]
  },
  'Product Manager': {
    label: 'Product Manager',
    permissions: ['dashboard', 'products']
  },
  'Order Manager': {
    label: 'Order Manager',
    permissions: ['dashboard', 'orders', 'customers', 'exports']
  },
  'Support Agent': {
    label: 'Support Agent',
    permissions: ['dashboard', 'complaints', 'reviews']
  },
  'Marketing Manager': {
    label: 'Marketing Manager',
    permissions: ['dashboard', 'email', 'banners', 'coupons', 'blog']
  },
  Accountant: {
    label: 'Accountant',
    permissions: ['dashboard', 'accounts', 'orders', 'exports']
  },
  'SEO Manager': {
    label: 'SEO Manager',
    permissions: ['dashboard', 'blog', 'exports']
  },
  'Content Writer': {
    label: 'Content Writer',
    permissions: ['dashboard', 'blog']
  },
  Custom: {
    label: 'Custom (pick manually)',
    permissions: ['dashboard']
  }
};

export const ROLE_NAMES = Object.keys(ROLE_PRESETS);

// Does a permissions array grant a given key?
// Anyone with the 'team' permission (Executive / super-admin) automatically
// has every permission - this future-proofs against new permission keys
// being added later without having to retroactively patch existing accounts.
export function can(permissions, key) {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes('team')) return true;
  return permissions.includes(key);
}

// Is this user the executive / super-admin?
export function isExecutive(permissions) {
  return Array.isArray(permissions) && permissions.includes('team');
}
