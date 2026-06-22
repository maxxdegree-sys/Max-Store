import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../auth.js';
import { requireExecutive, requireImportAccess } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { getSetting, setSetting } from '../store.js';
import { logAudit } from '../audit.js';
import { fetchAndParse } from '../util/scrape.js';
import { createProduct } from '../db/products.js';

const r = Router();

function normTitle(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function findDuplicates(parsed) {
  const products = await query('SELECT id, title, source_url FROM products');
  const incoming = new Set(normTitle(parsed.title).split(' ').filter((w) => w.length > 2));
  const hits = [];
  for (const p of products) {
    if (parsed.sourceUrl && p.source_url && p.source_url === parsed.sourceUrl) {
      hits.push({ id: p.id, title: p.title, reason: 'same source URL' });
      continue;
    }
    const exist = new Set(normTitle(p.title).split(' ').filter((w) => w.length > 2));
    if (!incoming.size || !exist.size) continue;
    let overlap = 0;
    incoming.forEach((w) => { if (exist.has(w)) overlap++; });
    const ratio = overlap / Math.min(incoming.size, exist.size);
    if (ratio >= 0.8) hits.push({ id: p.id, title: p.title, reason: 'similar title' });
    if (hits.length >= 5) break;
  }
  return hits;
}

// POST /api/import/preview
r.post('/preview', requireAuth, requireImportAccess, async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Please provide a product URL.' });
  const parsed = await fetchAndParse(url);
  const id = randomUUID();
  await query(
    `INSERT INTO import_log (id,at,user_id,user_name,url,status,error,title) VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7)`,
    [id, req.user.id, req.user.name, url, parsed.error ? 'failed' : 'previewed', parsed.error || null, parsed.title || null]
  );
  logAudit(req, { action: 'import.preview', entity: 'product', note: url + (parsed.error ? ' (failed)' : '') });
  if (parsed.error) return res.status(422).json({ error: parsed.error, logId: id });
  res.json({ draft: parsed, duplicates: await findDuplicates(parsed), logId: id });
});

// POST /api/import/commit
r.post('/commit', requireAuth, requireImportAccess, async (req, res, next) => {
  try {
    const p = req.body?.product;
    if (!p || !p.title) return res.status(400).json({ error: 'Product title is required.' });
    const draft = {
      id: 'imp-' + Date.now(),
      sku: p.sku || 'ARS-' + Math.floor(1000 + Math.random() * 9000),
      title: p.title,
      slug: (p.slug || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category: p.category || 'imported-products',
      brand: p.brand || 'Imported',
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || Number(p.price) || 0,
      costPrice: Number(p.costPrice) || 0,
      stock: Number(p.stock) || 0,
      supplier: p.supplier || '',
      images: Array.isArray(p.images) ? p.images : [],
      short: p.short || '',
      description: p.description || '',
      specs: p.specs || {},
      tags: Array.isArray(p.tags) ? p.tags : ['imported'],
      variants: p.variants || [],
      status: 'draft',
      source: 'import',
      sourceUrl: p.sourceUrl || ''
    };
    const product = await createProduct(draft);
    logAudit(req, { action: 'import.commit', entity: 'product', entityId: product.id, after: { title: product.title, price: product.price }, note: 'Imported product saved as draft' });
    res.json({ product });
  } catch (e) { next(e); }
});

// GET /api/import/settings  (executive)
r.get('/settings', requireAuth, requireExecutive, async (_req, res, next) => {
  try {
    const importSetting = await getSetting('import') || { enabled: true, allowedUserIds: [] };
    const admins = await query('SELECT id, name, role FROM admin_users ORDER BY created_at');
    res.json({ import: importSetting, admins });
  } catch (e) { next(e); }
});

// PUT /api/import/settings  (executive)
r.put('/settings', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const current = await getSetting('import') || { enabled: true, allowedUserIds: [] };
    const before = { ...current };
    const { enabled, allowedUserIds } = req.body || {};
    if (typeof enabled === 'boolean') current.enabled = enabled;
    if (Array.isArray(allowedUserIds)) current.allowedUserIds = allowedUserIds;
    await setSetting('import', current);
    logAudit(req, { action: 'settings.import', entity: 'settings', before, after: current, note: 'Updated import access' });
    res.json({ import: current });
  } catch (e) { next(e); }
});

// GET /api/import/log  (executive)
r.get('/log', requireAuth, requireExecutive, async (_req, res, next) => {
  try {
    const rows = await query('SELECT * FROM import_log ORDER BY at DESC LIMIT 200');
    res.json({ log: rows });
  } catch (e) { next(e); }
});

export default r;
