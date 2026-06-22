import { randomUUID } from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging as getFcmMessaging } from 'firebase-admin/messaging';
import { query } from '../db/pg.js';

let messaging = null;
let initError = null;

function ensureAdmin() {
  if (messaging) return messaging;
  if (initError) return null;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const serviceAccount = JSON.parse(raw);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    messaging = getFcmMessaging();
    return messaging;
  } catch (e) {
    initError = e;
    console.warn('[fcm] init failed:', e.message);
    return null;
  }
}

export async function getMessaging() {
  return ensureAdmin();
}

export function isFcmEnabled() {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !initError;
}

export async function getTokensForUser(userType, userId) {
  const rows = await query(
    'SELECT token FROM push_tokens WHERE user_type = $1 AND user_id = $2',
    [userType, String(userId)]
  );
  return rows.map((r) => r.token).filter(Boolean);
}

export async function savePushToken({ userType, userId, token, userAgent = '' }) {
  if (!token) return;
  const id = 'pt-' + randomUUID();
  await query(
    `INSERT INTO push_tokens (id, user_type, user_id, token, user_agent, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
     ON CONFLICT (token) DO UPDATE SET user_type = $2, user_id = $3, user_agent = $5, updated_at = NOW()`,
    [id, userType, String(userId), token, userAgent]
  );
}

export async function removePushToken(token) {
  if (!token) return;
  await query('DELETE FROM push_tokens WHERE token = $1', [token]);
}

async function pruneInvalidTokens(tokens, response) {
  if (!response?.responses) return;
  const invalid = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || '';
      if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
        invalid.push(tokens[i]);
      }
    }
  });
  for (const t of invalid) {
    await removePushToken(t).catch(() => {});
  }
}

const siteUrl = () => process.env.SITE_URL || 'https://alrafiq.pk';

/** Send FCM push to all devices registered for a user. */
export async function sendPushToUser(userType, userId, { title, body = '', link = '', notificationId = '' }) {
  const msg = ensureAdmin();
  if (!msg) return { sent: 0, skipped: 'fcm_not_configured' };

  const tokens = await getTokensForUser(userType, userId);
  if (!tokens.length) return { sent: 0, skipped: 'no_tokens' };

  const fullLink = link.startsWith('http') ? link : siteUrl() + (link.startsWith('/') ? link : '/' + link);

  try {
    const response = await msg.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        title: String(title || ''),
        body: String(body || ''),
        link: link || '/',
        notificationId: notificationId || ''
      },
      webpush: {
        fcmOptions: { link: fullLink },
        notification: { icon: siteUrl() + '/logo.png' }
      }
    });
    await pruneInvalidTokens(tokens, response);
    return { sent: response.successCount, failed: response.failureCount };
  } catch (e) {
    console.warn('[fcm] send failed:', e.message);
    return { sent: 0, error: e.message };
  }
}

/** Smoke test: send to a dummy token to verify FCM API credentials. */
export async function testFcmSend() {
  const msg = ensureAdmin();
  if (!msg) return { ok: false, error: 'fcm_not_configured' };
  try {
    const response = await msg.sendEachForMulticast({
      tokens: ['test-invalid-token-for-smoke-test'],
      notification: { title: 'FCM test', body: 'If you see this, something went wrong.' }
    });
    return {
      ok: true,
      apiReachable: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
