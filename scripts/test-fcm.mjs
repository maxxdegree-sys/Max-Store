/**
 * Firebase FCM smoke test — prints only pass/fail, no secrets.
 * Usage: node --env-file=server/.env scripts/test-fcm.mjs
 */
const API = process.env.API_URL || 'http://127.0.0.1:4000';

function ok(label, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

async function main() {
  let passed = 0;
  let total = 0;
  const check = (label, pass, detail) => { total++; if (ok(label, pass, detail)) passed++; };

  check('FIREBASE_SERVICE_ACCOUNT_JSON set', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  check('FIREBASE_VAPID_KEY set', !!process.env.FIREBASE_VAPID_KEY);
  check('FIREBASE_PROJECT_ID set', process.env.FIREBASE_PROJECT_ID === 'maxx-7522a');

  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '');
    check('Service account JSON valid', parsed?.type === 'service_account' && !!parsed?.client_email);
  } catch (e) {
    check('Service account JSON valid', false, e.message);
  }

  try {
    const { testFcmSend } = await import('../server/src/services/fcm.js');
    const result = await testFcmSend();
    check('Firebase Admin API reachable', result.ok === true, result.error || `failures=${result.failureCount}`);
  } catch (e) {
    check('Firebase Admin API reachable', false, e.message);
  }

  try {
    const res = await fetch(`${API}/api/push/status`);
    const data = await res.json();
    check('API /api/push/status reachable', res.ok);
    check('fcmServer true', data.fcmServer === true);
    check('fcmClient true', data.fcmClient === true);
  } catch (e) {
    check('API /api/push/status reachable', false, e.message);
    check('fcmServer true', false, 'skipped');
    check('fcmClient true', false, 'skipped');
  }

  try {
    const res = await fetch(`${API}/firebase-config.js`);
    const text = await res.text();
    check('firebase-config.js served', res.ok && text.includes('maxx-7522a'));
  } catch (e) {
    check('firebase-config.js served', false, e.message);
  }

  console.log(`\n${passed}/${total} checks passed`);
  process.exit(passed === total ? 0 : 1);
}

main();
