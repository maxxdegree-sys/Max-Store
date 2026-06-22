import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app, { isFirebaseConfigured, vapidKey } from './config.js';
import { registerPushTokenApi } from '../api/client.js';
import { showBrowserNotification } from '../utils/pushNotifications.js';

let messagingInstance = null;
let swRegistration = null;

export function isFcmConfigured() {
  return isFirebaseConfigured() && !!vapidKey;
}

async function ensureServiceWorker() {
  if (swRegistration) return swRegistration;
  if (!('serviceWorker' in navigator)) return null;

  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    await navigator.serviceWorker.ready;
    swRegistration = reg;
    return swRegistration;
  } catch (e) {
    console.warn('[fcm] service worker unavailable:', e.message);
    return null;
  }
}

async function ensureMessaging() {
  if (!(await isSupported())) return null;
  if (!isFcmConfigured() || !app) return null;
  const sw = await ensureServiceWorker();
  if (!sw) return null;
  if (!messagingInstance) messagingInstance = getMessaging(app);
  return messagingInstance;
}

/** Request permission, obtain FCM token, register with API. Returns token or null. */
export async function enableFcmPush({ userType = 'customer' } = {}) {
  if (!(await isSupported())) return { ok: false, reason: 'unsupported' };
  if (!isFcmConfigured()) return { ok: false, reason: 'not_configured' };

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : Notification.permission === 'denied'
      ? 'denied'
      : await Notification.requestPermission();

  if (permission !== 'granted') return { ok: false, reason: permission };

  try {
    const messaging = await ensureMessaging();
    if (!messaging) return { ok: false, reason: 'messaging_unavailable' };

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) return { ok: false, reason: 'no_token' };

    await registerPushTokenApi(token, userType);
    setupForegroundListener(messaging);
    return { ok: true, token };
  } catch (e) {
    console.warn('[fcm] enable failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

/** Show in-app toast-style notification when a push arrives while the tab is focused. */
function setupForegroundListener(messaging) {
  if (messaging._foregroundHook) return;
  messaging._foregroundHook = true;
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Maxx';
    const body = payload.notification?.body || payload.data?.body || '';
    const link = payload.data?.link || '/';
    showBrowserNotification(title, { body, link, tag: payload.data?.notificationId || title });
  });
}

export async function tryRefreshFcmToken(userType = 'customer') {
  if (Notification.permission !== 'granted' || !isFcmConfigured()) return;
  try {
    const messaging = await ensureMessaging();
    if (!messaging) return;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
    if (token) {
      await registerPushTokenApi(token, userType);
      setupForegroundListener(messaging);
    }
  } catch { /* silent */ }
}
