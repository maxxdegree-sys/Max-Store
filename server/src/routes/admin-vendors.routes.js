// Admin-side CRUD for vendor (supplier) accounts. Mounted at /api/vendors-admin
// so it can't collide with /api/vendor (which is the vendor portal). Requires
// admin auth + 'vendors' permission (or executive).
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { logAudit } from '../audit.js';
import {
  listVendors, findVendor, findVendorByEmail,
  createVendor, updateVendor, setVendorPassword, deleteVendor, publicVendor
} from '../db/vendors.js';

const r = Router();

// All endpoints require an admin with the 'vendors' permission.
r.use(requireAuth, requirePermission('vendors'));

// GET / - list all vendors
r.get('/', async (_req, res, next) => {
  try {
    const vendors = (await listVendors()).map(publicVendor);
    res.json({ vendors });
  } catch (e) { next(e); }
});

// POST / - create a new vendor
r.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    if (await findVendorByEmail(email)) return res.status(409).json({ error: 'A vendor with this email already exists' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const v = await createVendor(req.body);
    logAudit(req, { action: 'vendor.add', entity: 'vendor', entityId: v.id, after: { name: v.name, email: v.email }, note: 'Added vendor ' + v.name }).catch(() => {});
    res.json({ vendor: publicVendor(v) });
  } catch (e) { next(e); }
});

// PATCH /:id - update vendor profile / status / commission
r.patch('/:id', async (req, res, next) => {
  try {
    const before = await findVendor(req.params.id);
    if (!before) return res.status(404).json({ error: 'Vendor not found' });
    const v = await updateVendor(req.params.id, req.body || {});
    logAudit(req, { action: 'vendor.update', entity: 'vendor', entityId: before.id, before: { status: before.status }, after: { status: v?.status }, note: 'Updated vendor ' + before.name }).catch(() => {});
    res.json({ vendor: publicVendor(v) });
  } catch (e) { next(e); }
});

// PATCH /:id/password - set/change vendor password
r.patch('/:id/password', async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const v = await findVendor(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vendor not found' });
    await setVendorPassword(v.id, password);
    logAudit(req, { action: 'vendor.password', entity: 'vendor', entityId: v.id, note: 'Password changed for ' + v.name }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /:id - remove a vendor
r.delete('/:id', async (req, res, next) => {
  try {
    const v = await findVendor(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vendor not found' });
    await deleteVendor(v.id);
    logAudit(req, { action: 'vendor.remove', entity: 'vendor', entityId: v.id, before: { name: v.name }, note: 'Removed vendor ' + v.name }).catch(() => {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
