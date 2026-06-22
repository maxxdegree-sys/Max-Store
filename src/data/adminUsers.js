import { ROLE_PRESETS } from '../utils/permissions';

// Seed admin team. The Executive can log in with any password in demo mode.
// Replace with Firestore "adminUsers" collection in production.
export const adminUsers = [
  {
    id: 'u-exec',
    name: 'Store Owner',
    email: 'Alrafiqshopping56@gmail.com',
    role: 'Executive',
    permissions: [...ROLE_PRESETS.Executive.permissions],
    status: 'active',
    department: 'Management',
    createdAt: '2026-01-01',
    lastLogin: null,
    lastLogout: null
  },
  {
    id: 'u-products',
    name: 'Imran (Catalog)',
    email: 'products@alrafiq.pk',
    role: 'Product Manager',
    permissions: [...ROLE_PRESETS['Product Manager'].permissions],
    status: 'active',
    department: 'Catalog',
    createdAt: '2026-02-10',
    lastLogin: '2026-05-16',
    lastLogout: '2026-05-16'
  },
  {
    id: 'u-support',
    name: 'Ayesha (Support)',
    email: 'support@alrafiq.pk',
    role: 'Support Agent',
    permissions: [...ROLE_PRESETS['Support Agent'].permissions],
    status: 'active',
    department: 'Customer Care',
    createdAt: '2026-03-05',
    lastLogin: '2026-05-17',
    lastLogout: '2026-05-17'
  },
  {
    id: 'u-accounts',
    name: 'Usman (Accounts)',
    email: 'accounts@alrafiq.pk',
    role: 'Accountant',
    permissions: [...ROLE_PRESETS.Accountant.permissions],
    status: 'active',
    department: 'Finance',
    createdAt: '2026-03-20',
    lastLogin: '2026-05-15',
    lastLogout: '2026-05-15'
  }
];
