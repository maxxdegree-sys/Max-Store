import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../auth.js';
import { requirePermission, requireExecutive } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { getSetting, setSetting } from '../store.js';
import { logAudit } from '../audit.js';
import { processImage, deleteByUrl, storageUsage, ALLOWED_MIME } from '../util/images.js';

const r = Router();

async function cfg() {
  const s = await getSetting('uploads') || {};
  return {
    maxFileMB: s.maxFileMB || 5,
    maxTotalMB: s.maxTotalMB || 25,
    requireApproval: !!s.requireApproval,
    watermark: s.watermark ? 'Maxx' : null
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG and WEBP images are allowed'))
});

const uploadMw = (req, res, next) =>
  upload.array('images', 12)(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next()));

// POST /api/uploads
r.post('/', requireAuth, requirePermission('products'), uploadMw, async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'No images provided.' });
  const c = await cfg();
  const total = files.reduce((a, f) => a + f.size, 0);
  if (total > c.maxTotalMB * 1024 * 1024)
    return res.status(413).json({ error: 'Total upload exceeds ' + c.maxTotalMB + ' MB.' });

  const results = [];
  for (const f of files) {
    if (f.size > c.maxFileMB * 1024 * 1024) { results.push({ error: f.originalname + ' is over ' + c.maxFileMB + ' MB', originalName: f.originalname }); continue; }
    try {
      const out = await processImage(f.buffer, f.mimetype, { watermark: c.watermark });
      const status = c.requireApproval ? 'pending' : 'approved';
      await query(
        `INSERT INTO media_library (id,url,thumb_url,original_name,product_id,uploaded_by,uploader_name,status,width,height,size_bytes,at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
        [out.id, out.url, out.thumbUrl || '', f.originalname, req.body.productId || null, req.user.id, req.user.name, status, out.width || 0, out.height || 0, out.sizeBytes || f.size]
      );
      results.push({ ...out, productId: req.body.productId || null, uploadedBy: req.user.id, uploaderName: req.user.name, status, originalName: f.originalname });
    } catch (e) { results.push({ error: e.message, originalName: f.originalname }); }
  }
  logAudit(req, { action: 'media.upload', entity: 'media', note: results.filter((x) => !x.error).length + ' image(s) uploaded' });
  res.json({ images: results, requireApproval: c.requireApproval });
});

// DELETE /api/uploads
r.delete('/', requireAuth, requirePermission('products'), async (req, res) => {
  const { url } = req.body || {};
  const before = await queryOne('SELECT * FROM media_library WHERE url = $1', [url]);
  const ok = deleteByUrl(url);
  await query('DELETE FROM media_library WHERE url = $1', [url]);
  logAudit(req, { action: 'media.delete', entity: 'media', before, note: url || '' });
  res.json({ ok });
});

// GET /api/uploads/usage  (executive)
r.get('/usage', requireAuth, requireExecutive, async (_req, res, next) => {
  try {
    const u = storageUsage();
    const s = await getSetting('uploads') || {};
    const row = await queryOne(`SELECT COUNT(*) AS c FROM media_library WHERE status = 'pending'`);
    res.json({ ...u, pending: Number(row.c), settings: s });
  } catch (e) { next(e); }
});

// GET /api/uploads/library
r.get('/library', requireAuth, requirePermission('products'), async (req, res, next) => {
  try {
    const sql = req.query.status
      ? 'SELECT * FROM media_library WHERE status = $1 ORDER BY at DESC LIMIT 300'
      : 'SELECT * FROM media_library ORDER BY at DESC LIMIT 300';
    const rows = await query(sql, req.query.status ? [req.query.status] : []);
    res.json({ images: rows });
  } catch (e) { next(e); }
});

// PATCH /api/uploads/:id/status  (executive: approve/reject)
r.patch('/:id/status', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const m = await queryOne('SELECT * FROM media_library WHERE id = $1', [req.params.id]);
    if (!m) return res.status(404).json({ error: 'Image not found' });
    const newStatus = req.body.status === 'approved' ? 'approved' : 'rejected';
    await query('UPDATE media_library SET status = $1 WHERE id = $2', [newStatus, m.id]);
    logAudit(req, { action: 'media.moderate', entity: 'media', entityId: m.id, before: { status: m.status }, after: { status: newStatus } });
    res.json({ image: { ...m, status: newStatus } });
  } catch (e) { next(e); }
});

// PUT /api/uploads/settings  (executive)
r.put('/settings', requireAuth, requireExecutive, async (req, res, next) => {
  try {
    const current = await getSetting('uploads') || {};
    const before = { ...current };
    const { maxFileMB, maxTotalMB, requireApproval, watermark } = req.body || {};
    if (Number(maxFileMB))              current.maxFileMB = Number(maxFileMB);
    if (Number(maxTotalMB))             current.maxTotalMB = Number(maxTotalMB);
    if (typeof requireApproval === 'boolean') current.requireApproval = requireApproval;
    if (typeof watermark === 'boolean') current.watermark = watermark;
    await setSetting('uploads', current);
    logAudit(req, { action: 'settings.uploads', entity: 'settings', before, after: current });
    res.json({ settings: current });
  } catch (e) { next(e); }
});

export default r;
