// Admin-side review of vendor listing requests. Mounted at /api/listing-requests-admin.
// Approve -> creates a real product (with vendor_id set) and marks request approved.
// Reject  -> marks request rejected with reviewer + reason.
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { logAudit } from '../audit.js';
import { query, queryOne } from '../db/pg.js';
import { createProduct } from '../db/products.js';
import { createNotification } from '../services/notifications.js';

const r = Router();
r.use(requireAuth, requirePermission('vendors'));

// GET / - list all listing requests
r.get('/', async (_req, res, next) => {
  try {
    const rows = await query('SELECT * FROM listing_requests ORDER BY created_at DESC');
    res.json({ requests: rows });
  } catch (e) { next(e); }
});

// POST /:id/approve - turn into a real product
r.post('/:id/approve', async (req, res, next) => {
  try {
    const id = req.params.id;
    const request = await queryOne('SELECT * FROM listing_requests WHERE id = $1', [id]);
    if (!request) return res.status(404).json({ error: 'Listing request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request was already ' + request.status + '.' });

    const proposed = request.product || {};
    const newId = 'p-' + Date.now();
    const slug = (proposed.title || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || newId;

    const createdProduct = await createProduct({
      id: newId,
      slug,
      title: proposed.title,
      brand: proposed.brand || '',
      category: proposed.category || 'electronics',
      subcategory: proposed.subcategory || '',
      price: Number(proposed.price) || 0,
      mrp: Number(proposed.mrp) || 0,
      stock: Number(proposed.stock) || 0,
      short: proposed.short || '',
      description: proposed.description || '',
      images: Array.isArray(proposed.images) ? proposed.images.filter(Boolean) : (proposed.image ? [proposed.image] : []),
      vendorId: request.vendor_id,
      status: 'active'
    });

    await query(
      `UPDATE listing_requests
          SET status = 'approved', reviewed_by = $1, reviewer_name = $2, reviewed_at = NOW(), product_id = $3
        WHERE id = $4`,
      [req.user?.id || null, req.user?.name || 'Admin', newId, id]
    );

    logAudit(req, { action: 'listing.approve', entity: 'listingRequest', entityId: id, after: { product_id: newId }, note: 'Approved listing for ' + (proposed.title || '') }).catch(() => {});
    createNotification({
      userType: 'vendor',
      userId: request.vendor_id,
      title: 'Listing approved',
      body: `"${proposed.title || 'Your product'}" is now live on the storefront.`,
      link: '/vendor/products'
    }).catch(() => {});
    res.json({ ok: true, product: createdProduct });
  } catch (e) { next(e); }
});

// POST /:id/reject
r.post('/:id/reject', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { reason } = req.body || {};
    const request = await queryOne('SELECT * FROM listing_requests WHERE id = $1', [id]);
    if (!request) return res.status(404).json({ error: 'Listing request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request was already ' + request.status + '.' });

    const noteText = reason
      ? (request.notes ? request.notes + ' | Rejection reason: ' + reason : 'Rejection reason: ' + reason)
      : request.notes;

    await query(
      `UPDATE listing_requests
          SET status = 'rejected', reviewed_by = $1, reviewer_name = $2, reviewed_at = NOW(), notes = $3
        WHERE id = $4`,
      [req.user?.id || null, req.user?.name || 'Admin', noteText, id]
    );

    logAudit(req, { action: 'listing.reject', entity: 'listingRequest', entityId: id, note: 'Rejected listing for ' + (request.product?.title || '') }).catch(() => {});
    createNotification({
      userType: 'vendor',
      userId: request.vendor_id,
      title: 'Listing not approved',
      body: reason ? `Reason: ${reason}` : 'Your listing request was not approved. Contact admin for details.',
      link: '/vendor/listing-requests'
    }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
