import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { logAudit } from '../audit.js';
import { optimizeProduct } from '../services/ai.js';
import {
  listProducts, findProduct, findProductBySlug,
  createProduct, updateProductRecord, deleteProductRecord
} from '../db/products.js';

const r = Router();

// PUBLIC list - storefront, active products only (slim + optional pagination)
r.get('/', async (req, res, next) => {
  try {
    const { page, limit, category, subcategory, tag, sale, q, sort, maxPrice, brands, slim } = req.query;
    const brandList = brands ? String(brands).split(',').map((b) => b.trim()).filter(Boolean) : undefined;
    const result = await listProducts({
      activeOnly: true,
      slim: slim !== '0',
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      tag: tag || undefined,
      sale: sale || undefined,
      q: q || undefined,
      sort: sort || 'popular',
      maxPrice: maxPrice != null && maxPrice !== '' ? Number(maxPrice) : undefined,
      brands: brandList
    });
    res.json(result);
  } catch (e) { next(e); }
});

// ADMIN list - all statuses (draft / archived included), full records
r.get('/all', requireAuth, requirePermission('products'), async (_req, res, next) => {
  try {
    const { products } = await listProducts({ activeOnly: false, slim: false });
    res.json({ products });
  } catch (e) { next(e); }
});

// PUBLIC get by slug - storefront product page
r.get('/by-slug/:slug', async (req, res, next) => {
  try {
    const p = await findProductBySlug(req.params.slug);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ product: p });
  } catch (e) { next(e); }
});

// PUBLIC get by id
r.get('/:id', async (req, res, next) => {
  try {
    const p = await findProduct(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ product: p });
  } catch (e) { next(e); }
});

// CREATE
r.post('/', requireAuth, requirePermission('products'), async (req, res, next) => {
  try {
    const p = req.body?.product || req.body || {};
    if (!p.title) return res.status(400).json({ error: 'Title is required' });
    if (!p.price && p.price !== 0) return res.status(400).json({ error: 'Price is required' });
    const saved = await createProduct(p);
    logAudit(req, { action: 'product.create', entity: 'product', entityId: saved.id, after: { title: saved.title, price: saved.price }, note: 'Created product' });
    res.json({ product: saved });
  } catch (e) { next(e); }
});

// UPDATE
r.put('/:id', requireAuth, requirePermission('products'), async (req, res, next) => {
  try {
    const before = await findProduct(req.params.id);
    if (!before) return res.status(404).json({ error: 'Product not found' });
    const patch = req.body?.product || req.body || {};
    const saved = await updateProductRecord(req.params.id, patch);
    logAudit(req, { action: 'product.update', entity: 'product', entityId: req.params.id, before: { title: before.title, price: before.price, status: before.status }, after: { title: saved.title, price: saved.price, status: saved.status }, note: 'Updated product' });
    res.json({ product: saved });
  } catch (e) { next(e); }
});

// DELETE
r.delete('/:id', requireAuth, requirePermission('products'), async (req, res, next) => {
  try {
    const before = await findProduct(req.params.id);
    if (!before) return res.status(404).json({ error: 'Product not found' });
    await deleteProductRecord(req.params.id);
    logAudit(req, { action: 'product.delete', entity: 'product', entityId: req.params.id, before: { title: before.title }, note: 'Deleted product' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// AI optimize (kept from earlier)
r.post('/optimize', requireAuth, requirePermission('products'), async (req, res, next) => {
  try {
    const out = await optimizeProduct({ product: req.body?.product || {} });
    logAudit(req, { action: 'product.optimize', entity: 'product', note: 'AI SEO optimize (' + out.mode + ')' });
    res.json(out);
  } catch (e) { next(e); }
});

export default r;
