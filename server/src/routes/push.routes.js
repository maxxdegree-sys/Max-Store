import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { requireCustomer } from '../auth.js';
import { savePushToken, removePushToken, testFcmSend } from '../services/fcm.js';

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'al-rafiq-dev-secret-change-me';

function publicFirebaseConfig() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

export function firebaseConfigScript(_req, res) {
  res.type('application/javascript').send(
    'self.FIREBASE_CONFIG = ' + JSON.stringify(publicFirebaseConfig()) + ';'
  );
}

// Public — used by PWA service worker via /firebase-config.js
r.get('/firebase-config', firebaseConfigScript);

r.get('/status', async (_req, res) => {
  const cfg = publicFirebaseConfig();
  const clientOk = !!(cfg.apiKey && cfg.projectId && (process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY));
  let serverOk = false;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const test = await testFcmSend();
    serverOk = test.ok === true;
  }
  res.json({
    fcmServer: serverOk,
    fcmClient: clientOk
  });
});

async function requireVendor(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isVendor) return res.status(403).json({ error: 'Vendor access only.' });
    req.pushUser = { type: 'vendor', id: decoded.vendorId };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired.' });
  }
}

function registerHandler(userType) {
  return async (req, res, next) => {
    try {
      const token = (req.body?.token || '').trim();
      if (!token) return res.status(400).json({ error: 'FCM token is required.' });
      const userId = userType === 'vendor' ? req.pushUser?.id : req.customer?.id;
      if (!userId) return res.status(401).json({ error: 'Login required.' });
      await savePushToken({
        userType,
        userId,
        token,
        userAgent: (req.headers['user-agent'] || '').slice(0, 500)
      });
      res.json({ ok: true });
    } catch (e) { next(e); }
  };
}

function unregisterHandler(userType) {
  return async (req, res, next) => {
    try {
      const token = (req.body?.token || '').trim();
      if (!token) return res.status(400).json({ error: 'FCM token is required.' });
      await removePushToken(token);
      res.json({ ok: true });
    } catch (e) { next(e); }
  };
}

r.post('/register/customer', requireCustomer, registerHandler('customer'));
r.delete('/register/customer', requireCustomer, unregisterHandler('customer'));

r.post('/register/vendor', requireVendor, registerHandler('vendor'));
r.delete('/register/vendor', requireVendor, unregisterHandler('vendor'));

export default r;
