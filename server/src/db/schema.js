import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './pg.js';
import { ROLE_PRESETS } from '../../../src/utils/permissions.js';
import { products as productSeedData } from '../../../src/data/products.js';

const DDL = `
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Custom',
  department TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT admin_users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT DEFAULT '',
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  short TEXT DEFAULT '',
  description TEXT DEFAULT '',
  specs JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  keywords TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  focus_keyword TEXT DEFAULT '',
  source TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  vendor_id TEXT DEFAULT NULL,
  display_rank INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  orders INTEGER NOT NULL DEFAULT 0,
  total_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  type TEXT DEFAULT 'Active',
  tags TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATE,
  last_activity DATE,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  label TEXT DEFAULT 'Home',
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT DEFAULT '',
  province TEXT DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_wishlist (
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'COD',
  payment_status TEXT DEFAULT 'Pending',
  delivery_status TEXT DEFAULT 'Processing',
  tracking TEXT DEFAULT '',
  courier TEXT DEFAULT '',
  est_delivery DATE,
  timeline JSONB NOT NULL DEFAULT '[]',
  assigned_staff TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  user_email TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  title TEXT DEFAULT '',
  comment TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  helpful INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  order_id TEXT DEFAULT '',
  product_id TEXT DEFAULT '',
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  kind TEXT DEFAULT 'other',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  replies JSONB NOT NULL DEFAULT '[]',
  internal_notes TEXT DEFAULT '',
  assignee TEXT DEFAULT NULL,
  assignee_name TEXT DEFAULT '',
  assignee_dept TEXT DEFAULT '',
  notes JSONB NOT NULL DEFAULT '[]',
  handler_history JSONB NOT NULL DEFAULT '[]',
  change_history JSONB NOT NULL DEFAULT '[]',
  events JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  percent NUMERIC(5,2) DEFAULT 0,
  fixed_amount NUMERIC(10,2) DEFAULT 0,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at DATE DEFAULT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_code_unique UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'hero',
  eyebrow TEXT DEFAULT '',
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  cta TEXT DEFAULT '',
  href TEXT DEFAULT '',
  image TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  color TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  cover TEXT DEFAULT '',
  content TEXT DEFAULT '',
  sections JSONB DEFAULT '[]',
  summary TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  author TEXT DEFAULT 'Maxx Editorial',
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  tags JSONB DEFAULT '[]',
  faqs JSONB DEFAULT '[]',
  keywords TEXT DEFAULT '',
  seo JSONB DEFAULT '{}',
  read_time INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS email_contacts (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  source TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  sent_at TIMESTAMPTZ DEFAULT NULL,
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  method TEXT DEFAULT 'Cash',
  status TEXT NOT NULL DEFAULT 'cleared',
  reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  thumb_url TEXT DEFAULT '',
  original_name TEXT DEFAULT '',
  product_id TEXT DEFAULT NULL,
  uploaded_by TEXT DEFAULT NULL,
  uploader_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  size_bytes INTEGER DEFAULT 0,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  user_name TEXT DEFAULT 'system',
  role TEXT DEFAULT '',
  department TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity TEXT DEFAULT '',
  entity_id TEXT,
  ticket_id TEXT,
  order_id TEXT,
  before_val JSONB,
  after_val JSONB,
  note TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS import_log (
  id TEXT PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  user_name TEXT DEFAULT '',
  url TEXT NOT NULL,
  status TEXT DEFAULT 'previewed',
  error TEXT,
  title TEXT
);

CREATE TABLE IF NOT EXISTS export_log (
  id TEXT PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  user_name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  entity TEXT NOT NULL,
  format TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}',
  ip TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendor / supplier companies (e.g. Samsung) with their own portal login.
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  commission_pct NUMERIC(5,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT vendors_email_unique UNIQUE (email)
);

-- Product proposals submitted by vendors; admin approves into real products.
CREATE TABLE IF NOT EXISTS listing_requests (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT DEFAULT '',
  product JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewer_name TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const DEFAULT_PASSWORDS = {
  'alrafiqshopping56@gmail.com': 'alrafiq123',
  'products@alrafiq.pk': 'products123',
  'support@alrafiq.pk': 'support123',
  'accounts@alrafiq.pk': 'accounts123'
};

async function seedAdminUsers() {
  const base = [
    { id: 'u-exec',     name: 'Store Owner',      email: 'Alrafiqshopping56@gmail.com', role: 'Executive',       department: 'Management' },
    { id: 'u-products', name: 'Imran (Catalog)',   email: 'products@alrafiq.pk',         role: 'Product Manager', department: 'Catalog' },
    { id: 'u-support',  name: 'Ayesha (Support)',  email: 'support@alrafiq.pk',          role: 'Support Agent',   department: 'Customer Care' },
    { id: 'u-accounts', name: 'Usman (Accounts)',  email: 'accounts@alrafiq.pk',         role: 'Accountant',      department: 'Finance' }
  ];
  for (const u of base) {
    const pwd = DEFAULT_PASSWORDS[u.email.toLowerCase()] || 'changeme123';
    const preset = ROLE_PRESETS[u.role] || ROLE_PRESETS.Custom;
    await query(
      `INSERT INTO admin_users (id, name, email, role, department, permissions, status, password_hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',$7,'2026-01-01')
       ON CONFLICT (email) DO NOTHING`,
      [u.id, u.name, u.email, u.role, u.department, JSON.stringify(preset.permissions), bcrypt.hashSync(pwd, 8)]
    );
  }
}

async function seedProducts() {
  const existing = await queryOne('SELECT id FROM products LIMIT 1');
  if (existing) return;
  for (let i = 0; i < productSeedData.length; i++) {
    const p = productSeedData[i];
    const id = p.id || ('p-seed-' + i);
    const slug = p.slug || (p.title || id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const vendorId = ['p7', 'p8'].includes(id) ? 'v-samsung' : null;
    await query(
      `INSERT INTO products
         (id,sku,slug,title,brand,category,price,mrp,cost_price,stock,sold,supplier,status,short,description,specs,tags,variants,images,keywords,source,vendor_id,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'2026-01-01','2026-01-01')
       ON CONFLICT (slug) DO NOTHING`,
      [
        id,
        'ARS-' + String(1000 + i),
        slug,
        p.title,
        p.brand || 'Maxx',
        p.category || '',
        p.price || 0,
        p.mrp || p.price || 0,
        Math.round((p.price || 0) * 0.7),
        p.stock ?? 0,
        p.sold ?? 0,
        '',
        'active',
        p.short || '',
        p.description || '',
        JSON.stringify(p.specs || {}),
        JSON.stringify(p.tags || []),
        JSON.stringify(p.variants || []),
        JSON.stringify(p.images || []),
        '',
        'seed',
        vendorId
      ]
    );
  }
}

async function seedCustomers() {
  const existing = await queryOne('SELECT id FROM customers LIMIT 1');
  if (existing) return;
  const rows = [
    ['C-001','Ayesha Khan',  'ayesha@example.com', '+92 300 1234567','Lahore',    'House 12, Model Town, Lahore',      12,56400,'Paid',   'VIP',   'loyal,wholesale','Prefers COD',    '2024-08-12','2026-05-17',true],
    ['C-002','Hamza Riaz',   'hamza@example.com',  '+92 312 9876543','Islamabad', 'Flat 4B, F-11 Markaz, Islamabad',   7, 32100,'Paid',   'Active','electronics',   '',               '2024-11-03','2026-05-17',true],
    ['C-003','Sana Tariq',   'sana.t@example.com', '+92 333 1112233','Karachi',   'Bungalow 9, DHA Phase 6, Karachi',  4, 12300,'Pending','Active','',              'Bank transfer',  '2025-01-19','2026-05-16',true],
    ['C-004','Bilal Ahmed',  'bilal@example.com',  '+92 311 2223344','Faisalabad','Street 3, Jaranwala Rd, Faisalabad',9, 44120,'Paid',   'Active','kitchen',       '',               '2024-06-22','2026-05-16',true],
    ['C-005','Mariam Yousaf','mariam@example.com', '+92 345 4445566','Multan',    'House 77, Gulgasht, Multan',         2, 5980, 'Paid',   'New',   '',              '',               '2025-04-02','2026-04-30',false]
  ];
  for (const r of rows) {
    await query(
      `INSERT INTO customers (id,name,email,phone,city,address,orders,total_spend,payment_status,type,tags,notes,created_at,last_activity,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
      r
    );
  }
}

async function seedOrders() {
  const existing = await queryOne('SELECT id FROM orders LIMIT 1');
  if (existing) return;
  const rows = [
    {id:'ARS-1029',cn:'Ayesha Khan',  cp:'+92 300 1234567',city:'Lahore',    items:[{sku:'ARS-1000',name:'National Deluxe Blender',qty:1,price:6499,category:'kitchen-appliances'}],   sub:6499, dis:500,tax:0,ship:0,  pm:'COD',           ps:'Pending', ds:'Processing',tr:'',          as:'Imran (Catalog)',  notes:'Call before delivery',  cat:'kitchen-appliances',created:'2026-05-17'},
    {id:'ARS-1028',cn:'Hamza Riaz',   cp:'+92 312 9876543',city:'Islamabad', items:[{sku:'ARS-1003',name:'Royal Bone China Dinner Set',qty:1,price:18999,category:'crockery'}],        sub:18999,dis:0,  tax:0,ship:0,  pm:'Bank Transfer', ps:'Paid',    ds:'Delivered',  tr:'TRK-552190',as:'Ayesha (Support)', notes:'',                     cat:'crockery',          created:'2026-05-17'},
    {id:'ARS-1027',cn:'Sana Tariq',   cp:'+92 333 1112233',city:'Karachi',   items:[{sku:'ARS-1006',name:'Wireless Earbuds Pro',qty:1,price:4499,category:'electronics'},{sku:'ARS-1004',name:'Glass Tumbler Set',qty:2,price:1499,category:'crockery'}], sub:7497,dis:0,tax:0,ship:0, pm:'Bank Transfer',ps:'Pending',ds:'In Transit',tr:'TRK-552188',as:'Ayesha (Support)',notes:'',cat:'electronics',created:'2026-05-16'},
    {id:'ARS-1026',cn:'Bilal Ahmed',  cp:'+92 311 2223344',city:'Faisalabad',items:[{sku:'ARS-1002',name:'Anex Sandwich Maker',qty:1,price:3499,category:'kitchen-appliances'}],       sub:3499, dis:0,  tax:0,ship:300,pm:'COD',           ps:'Paid',    ds:'Delivered',  tr:'TRK-552180',as:'Imran (Catalog)',  notes:'Allow-to-open delivery',cat:'kitchen-appliances',created:'2026-05-16'},
    {id:'ARS-1025',cn:'Mariam Yousaf',cp:'+92 345 4445566',city:'Multan',    items:[{sku:'ARS-1001',name:'Philips Electric Kettle',qty:1,price:4299,category:'kitchen-appliances'}],   sub:4299, dis:0,  tax:0,ship:0,  pm:'COD',           ps:'Refunded',ds:'Cancelled',   tr:'',          as:'Usman (Accounts)', notes:'Customer cancelled',    cat:'kitchen-appliances',created:'2026-05-15'}
  ];
  for (const o of rows) {
    const total = o.sub - o.dis + o.tax + o.ship;
    await query(
      `INSERT INTO orders (id,customer_name,customer_phone,city,items,subtotal,discount,tax,shipping,total,payment_method,payment_status,delivery_status,tracking,assigned_staff,notes,category,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18) ON CONFLICT (id) DO NOTHING`,
      [o.id,o.cn,o.cp,o.city,JSON.stringify(o.items),o.sub,o.dis,o.tax,o.ship,total,o.pm,o.ps,o.ds,o.tr,o.as,o.notes,o.cat,o.created]
    );
  }
}

async function seedCoupons() {
  const existing = await queryOne('SELECT id FROM coupons LIMIT 1');
  if (existing) return;
  const rows = [
    ['c-welcome', 'WELCOME10', 10, 0, 1500, 'Welcome10 — 10% off for new customers'],
    ['c-eid',     'EID20',     20, 0, 3000, 'Eid Mega Sale — 20% off'],
    ['c-kharian', 'KHARIAN15', 15, 0, 2000, 'Local Kharian special']
  ];
  for (const [id, code, pct, fixed, min, desc] of rows) {
    await query(
      `INSERT INTO coupons (id,code,percent,fixed_amount,min_order,description) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO NOTHING`,
      [id, code, pct, fixed, min, desc]
    );
  }
}

async function seedBanners() {
  const existing = await queryOne('SELECT id FROM banners LIMIT 1');
  if (existing) return;
  const rows = [
    {id:'b-1',type:'hero',eyebrow:'Mega Sale • Eid Special',title:'Premium Kitchen Essentials',subtitle:'Up to 50% off on top-rated kitchen appliances. Free COD across Pakistan.',cta:'Shop Kitchen',href:'/category/kitchen-appliances',image:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80&auto=format&fit=crop',badge:'50% OFF',sort_order:0},
    {id:'b-2',type:'hero',eyebrow:'New Arrivals',title:'Smart Electronics For Every Home',subtitle:'Headphones, smart watches & accessories — backed by 7-day return.',cta:'Discover Now',href:'/category/electronics',image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=80&auto=format&fit=crop',badge:'NEW',sort_order:1},
    {id:'b-3',type:'hero',eyebrow:'Daily Deals',title:'Crockery That Feels Premium',subtitle:'Hand-picked dinner sets, glassware and serveware — Kharian to your door.',cta:'Shop Crockery',href:'/category/crockery',image:'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1400&q=80&auto=format&fit=crop',badge:'TRENDING',sort_order:2},
    {id:'b-4',type:'promo',title:'Free Home Delivery',subtitle:'Free on every order',href:'/shop',color:'from-brand-500 to-brand-700',image:'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=900&q=80&auto=format&fit=crop',sort_order:0},
    {id:'b-5',type:'promo',title:'Email Support',subtitle:'support@maxxdegree.com',href:'/contact',color:'from-brand-500 to-brand-700',image:'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=900&q=80&auto=format&fit=crop',sort_order:1},
    {id:'b-6',type:'promo',title:'New Customer Offer',subtitle:'Use code WELCOME10',href:'/shop',color:'from-brand-500 to-brand-700',image:'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&auto=format&fit=crop',sort_order:2}
  ];
  for (const b of rows) {
    await query(
      `INSERT INTO banners (id,type,eyebrow,title,subtitle,cta,href,image,badge,color,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      [b.id,b.type,b.eyebrow||'',b.title,b.subtitle||'',b.cta||'',b.href||'',b.image||'',b.badge||'',b.color||'',b.sort_order]
    );
  }
}

async function seedReviews() {
  const existing = await queryOne('SELECT id FROM reviews LIMIT 1');
  if (existing) return;
  // product_id values match the seeded catalog (p1..p24 from data/products.js).
  // Most are 'approved' so they show on the storefront immediately; a couple are
  // 'pending' so you can test the admin moderation/approve flow.
  const rows = [
    ['rv-1', 'p1', 'Ayesha Khan',   'ayesha@example.com', 5, 'Powerful and quiet',      'Blends frozen fruit smoothies in seconds. Build quality feels premium for the price.', '2026-05-10', 'approved', 14, true],
    ['rv-2', 'p1', 'Hamza Riaz',    '',                   4, 'Great value',             'Does everything I need. The dry-grinding jar is a nice bonus. Knocked one star for the loud motor.', '2026-05-08', 'approved', 6, true],
    ['rv-3', 'p1', 'Bilal Ahmed',   '',                   5, 'Worth it',                'Used it daily for two weeks, no issues at all. Highly recommend.', '2026-04-28', 'approved', 3, false],
    ['rv-4', 'p2', 'Sana Tariq',    'sana.t@example.com', 5, 'Boils super fast',        'The 2200W element is no joke — boils a full kettle in under three minutes. Auto shut-off works perfectly.', '2026-05-12', 'approved', 9, true],
    ['rv-5', 'p2', 'Mariam Yousaf', '',                   4, 'Good kettle',             'Sleek stainless finish and feels sturdy. Lid could open a little wider but otherwise great.', '2026-05-01', 'approved', 2, true],
    ['rv-6', 'p3', 'Imran Q.',      '',                   4, 'Crispy sandwiches',       'Heats evenly and the non-stick plates clean up easily. Indicator lights are handy.', '2026-04-22', 'approved', 5, true],
    ['rv-7', 'p4', 'Nadia Sheikh',  '',                   5, 'Absolutely stunning',     'The bone china is gorgeous and feels high-end. Arrived well packed with zero breakage.', '2026-05-14', 'approved', 18, true],
    ['rv-8', 'p4', 'Farhan Ali',    '',                   5, 'Perfect for guests',      'Bought for Eid — guests kept complimenting the dinner set. Excellent quality.', '2026-05-03', 'approved', 7, true],
    ['rv-9', 'p5', 'Zoya M.',       '',                   4, 'Elegant glassware',       'Nice weight and clarity. One glass had a tiny scratch but support sorted it quickly.', '2026-04-30', 'approved', 1, false],
    ['rv-10','p6', 'Usman Tariq',   '',                   5, 'Great sound',             'Bass is punchy and battery lasts all day. Pairing was instant. Very happy.', '2026-05-15', 'approved', 11, true],
    // Pending — will only appear on the storefront after you approve them in /admin/reviews
    ['rv-11','p1', 'Test Reviewer', 'test@example.com',   3, 'Decent but pricey',       'Works fine but I expected a bit more for the money. Waiting to see long-term durability.', '2026-05-17', 'pending', 0, false],
    ['rv-12','p6', 'Kiran A.',      '',                   2, 'Mic could be better',     'Sound is good for music but call quality is average in noisy places.', '2026-05-16', 'pending', 0, false]
  ];
  for (const r of rows) {
    await query(
      `INSERT INTO reviews (id,product_id,user_name,user_email,rating,title,comment,date,status,helpful,verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      r
    );
  }
}

async function seedBlog() {
  const existing = await queryOne('SELECT id FROM blog_posts LIMIT 1');
  if (existing) return;
  const img = (p) => `https://images.unsplash.com/${p}?w=1200&q=80&auto=format&fit=crop`;
  const rows = [
    {
      id: 'bp-1', slug: 'choosing-the-right-blender', title: 'How to Choose the Right Blender for Your Kitchen',
      cover: img('photo-1570194065650-d99fb4b8ccb9'), category: 'Kitchen', author: 'Maxx Editorial',
      summary: 'Wattage, jar materials, blade types and the features that actually matter when buying a blender in Pakistan.',
      content: 'A good blender is the workhorse of any kitchen. In this guide we break down the three things that matter most: motor wattage, jar material, and blade design. For daily shakes and chutneys, 600–800W is the sweet spot. Stainless steel blades outlast plastic-mounted ones, and a glass jar resists staining better than plastic. Finally, look for overload protection and a 1-year warranty for peace of mind.',
      tags: ['kitchen', 'buying-guide', 'appliances'], read_time: 4, date: '2026-05-10'
    },
    {
      id: 'bp-2', slug: 'caring-for-bone-china', title: 'Caring for Your Bone China Dinner Set',
      cover: img('photo-1578749556568-bc2c40e68b61'), category: 'Crockery', author: 'Maxx Editorial',
      summary: 'Simple habits to keep your premium dinner set looking new for years — washing, stacking and storage tips.',
      content: 'Bone china is durable, but a few good habits keep it pristine. Hand-wash with a soft sponge and mild detergent; avoid abrasive scrubbers. When stacking plates, place a soft cloth or felt pad between them to prevent scratches. Never expose pieces with metallic trim to the microwave. Store cups hanging or upright rather than stacked to protect the rims.',
      tags: ['crockery', 'care-guide'], read_time: 3, date: '2026-05-04'
    },
    {
      id: 'bp-3', slug: 'best-budget-electronics-2026', title: 'Best Budget Electronics to Buy in 2026',
      cover: img('photo-1505740420928-5e560c06d30e'), category: 'Electronics', author: 'Maxx Editorial',
      summary: 'From wireless earbuds to smart watches — our picks for the best value tech you can order with COD.',
      content: 'You don’t need to overspend to get great tech. This year’s standouts include true-wireless earbuds with solid battery life, entry-level smart watches with heart-rate tracking, and reliable power banks. We weigh value, warranty and after-sales support so you can buy with confidence — all available with cash-on-delivery across Pakistan.',
      tags: ['electronics', 'deals', 'buying-guide'], read_time: 5, date: '2026-05-15'
    }
  ];
  for (const b of rows) {
    await query(
      `INSERT INTO blog_posts (id,slug,title,cover,content,sections,summary,date,author,category,status,tags,faqs,keywords,seo,read_time)
       VALUES ($1,$2,$3,$4,$5,'[]',$6,$7,$8,$9,'published',$10,'[]',$11,'{}',$12) ON CONFLICT (slug) DO NOTHING`,
      [b.id, b.slug, b.title, b.cover, b.content, b.summary, b.date, b.author, b.category, JSON.stringify(b.tags), b.tags.join(', '), b.read_time]
    );
  }
}

async function seedComplaints() {
  const existing = await queryOne('SELECT id FROM complaints LIMIT 1');
  if (existing) return;
  const event = (action, detail, by = 'System', role = 'System') =>
    ({ id: randomUUID(), at: new Date().toISOString(), action, detail, by, role });
  const rows = [
    {id:'TKT-2026-0001',orderId:'ARS-1027',productId:'p6',name:'Sana Tariq',  email:'sana.t@example.com',phone:'+92 333 1112233',city:'Karachi',  kind:'product-issue', subject:'Earbuds right side not charging', message:'One of the earbuds stopped charging after three days. The left one works fine. Please advise on replacement.', status:'new',         priority:'high',   date:'2026-05-16'},
    {id:'TKT-2026-0002',orderId:'ARS-1026',productId:'p3',name:'Bilal Ahmed', email:'bilal@example.com', phone:'+92 311 2223344',city:'Faisalabad',kind:'delivery',      subject:'Late delivery',                 message:'My order was supposed to arrive in 3 days but took 6. Otherwise the product is fine.',                          status:'in-progress',priority:'normal', date:'2026-05-15'},
    {id:'TKT-2026-0003',orderId:'',        productId:'',  name:'Hamza Riaz',  email:'hamza@example.com', phone:'+92 312 9876543',city:'Islamabad', kind:'general',       subject:'Do you offer bulk discounts?',  message:'I run a small cafe and want to order crockery in bulk. Is there a wholesale rate available?',                   status:'resolved',   priority:'low',    date:'2026-05-12'}
  ];
  for (const c of rows) {
    const events = [event('opened', 'Ticket opened by customer', c.name, 'Customer')];
    if (c.status === 'resolved') events.push(event('resolved', 'Marked as resolved', 'Ayesha (Support)', 'Support Agent'));
    await query(
      `INSERT INTO complaints (id,order_id,product_id,name,email,phone,city,kind,subject,message,status,priority,date,events,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`,
      [c.id,c.orderId,c.productId,c.name,c.email,c.phone,c.city,c.kind,c.subject,c.message,c.status,c.priority,c.date,JSON.stringify(events)]
    );
  }
}

async function seedEmailContacts() {
  const existing = await queryOne('SELECT id FROM email_contacts LIMIT 1');
  if (existing) return;
  const rows = [
    ['ec-seed-1','Ayesha Khan',  'ayesha@example.com',  '+92 300 1234567','Lahore',   'order',      'vip',    true],
    ['ec-seed-2','Hamza Riaz',   'hamza@example.com',   '+92 312 9876543','Islamabad','order',      '',       true],
    ['ec-seed-3','',             'subscriber1@example.com','',            '',         'newsletter', '',       true],
    ['ec-seed-4','',             'subscriber2@example.com','',            '',         'newsletter', '',       true],
    ['ec-seed-5','Mariam Yousaf','mariam@example.com',  '+92 345 4445566','Multan',   'manual',     '',       false]
  ];
  for (const r of rows) {
    await query(
      `INSERT INTO email_contacts (id,name,email,phone,city,source,tags,subscribed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      r
    );
  }
}

// Seed a single Samsung test vendor on first boot so the vendor portal
// (/vendor/login) works out of the box. Password is 'samsung123'.
async function seedVendors() {
  await query(
    `INSERT INTO vendors (id, name, email, password_hash, contact_name, phone, address, status, commission_pct, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'active',10,$8)
     ON CONFLICT (id) DO NOTHING`,
    [
      'v-samsung',
      'Samsung',
      'samsung@vendor.maxx.pk',
      bcrypt.hashSync('samsung123', 8),
      'Samsung Brand Representative',
      '+92 300 0000000',
      'Samsung Electronics Pakistan, Karachi',
      'Default seed vendor.'
    ]
  );
}

async function seedSettings() {
  const rows = [
    ['import', { enabled: true, allowedUserIds: [] }],
    ['uploads', { maxFileMB: 5, maxTotalMB: 25, requireApproval: false, watermark: false }]
  ];
  for (const [key, value] of rows) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    );
  }
}

async function runMigrations() {
  const migrations = [
    `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover TEXT DEFAULT ''`,
    `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS keywords TEXT DEFAULT ''`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id TEXT DEFAULT NULL`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS display_rank INTEGER DEFAULT NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT DEFAULT ''`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS est_delivery DATE`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS timeline JSONB NOT NULL DEFAULT '[]'`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews (product_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status)`,
    `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone)`,
    `CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers (lower(email))`,
    `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders (delivery_status)`,
    `CREATE INDEX IF NOT EXISTS idx_blog_posts_status_date ON blog_posts (status, date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products (status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products (vendor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listing_requests_vendor_id ON listing_requests (vendor_id)`,
    `UPDATE products SET vendor_id = 'v-samsung' WHERE id IN ('p7', 'p8') AND (vendor_id IS NULL OR vendor_id = '')`,
    `UPDATE vendors SET email = 'samsung@vendor.maxx.pk' WHERE id = 'v-samsung' AND email = 'samsung@vendor.alrafiq.pk'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT ''`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)`,
    `CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products (subcategory)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_type, user_id, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS push_tokens (
      id TEXT PRIMARY KEY,
      user_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_type, user_id)`
  ];
  for (const sql of migrations) {
    await query(sql).catch(() => {});
  }
}

export async function initDB() {
  await query(DDL);
  await runMigrations();
  await Promise.all([
    seedAdminUsers(),
    seedProducts(),
    seedCustomers(),
    seedOrders(),
    seedCoupons(),
    seedBanners(),
    seedReviews(),
    seedBlog(),
    seedComplaints(),
    seedEmailContacts(),
    seedVendors(),
    seedSettings()
  ]);
  console.log('[db] PostgreSQL schema ready');
}
