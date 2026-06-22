import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db/schema.js';
import { PATHS } from './store.js';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import importRoutes from './routes/import.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import exportsRoutes from './routes/exports.routes.js';
import aiRoutes from './routes/ai.routes.js';
import seoRoutes from './routes/seo.routes.js';
import teamRoutes from './routes/team.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import customersRoutes from './routes/customers.routes.js';
import complaintsRoutes from './routes/complaints.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import bannersRoutes from './routes/banners.routes.js';
import blogRoutes from './routes/blog.routes.js';
import emailRoutes from './routes/email.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import adminVendorsRoutes from './routes/admin-vendors.routes.js';
import adminListingRequestsRoutes from './routes/admin-listing-requests.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import commissionRoutes from './routes/commission.routes.js';
import pushRoutes, { firebaseConfigScript } from './routes/push.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', '..', 'dist');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded images
app.use('/api/media', express.static(PATHS.UPLOAD_DIR, { maxAge: '7d', fallthrough: true }));

let dbReady = false;
let dbError = null;

app.get('/api/health', (_req, res) => {
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    db: dbReady,
    service: 'al-rafiq-api',
    time: new Date().toISOString(),
    ...(dbError ? { error: dbError.message } : {})
  });
});

// Accept connections immediately; hold API traffic until Neon/Postgres is ready.
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || dbReady) return next();
  if (dbError) {
    return res.status(503).json({ error: 'Database connection failed. Check server logs.', db: false });
  }
  return res.status(503).json({ error: 'Server is starting up. Please retry in a moment.', db: false, starting: true });
});

app.use('/api/auth',       authRoutes);
app.use('/api/account',    accountRoutes);
app.use('/api/import',     importRoutes);
app.use('/api/uploads',    uploadsRoutes);
app.use('/api/exports',    exportsRoutes);
app.use('/api/ai',         aiRoutes);
app.use('/api/seo',        seoRoutes);
app.use('/api/team',       teamRoutes);
app.use('/api/products',   productsRoutes);
app.use('/api/orders',     ordersRoutes);
app.use('/api/customers',  customersRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/reviews',    reviewsRoutes);
app.use('/api/coupons',    couponsRoutes);
app.use('/api/banners',    bannersRoutes);
app.use('/api/blog',       blogRoutes);
app.use('/api/email',      emailRoutes);
app.use('/api/accounts',   accountsRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/vendor',     vendorRoutes);
app.use('/api/vendors-admin', adminVendorsRoutes);
app.use('/api/listing-requests-admin', adminListingRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/push', pushRoutes);
app.get('/firebase-config.js', firebaseConfigScript);

// 404 for unmatched API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve built frontend in production
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
  console.log('[server] serving built frontend from', DIST);
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log('Maxx API listening on http://localhost:' + PORT));

initDB()
  .then(() => {
    dbReady = true;
    console.log('[db] PostgreSQL schema ready');
  })
  .catch((err) => {
    console.error('[startup] DB init failed:', err);
    process.exit(1);
  });
