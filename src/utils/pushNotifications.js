// Browser + Firebase FCM push helpers.

import { enableFcmPush, isFcmConfigured, tryRefreshFcmToken } from '../firebase/messaging.js';

export async function requestPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/** Prefer FCM when configured; fall back to browser-only notifications. */
export async function enableAppPush({ userType = 'customer' } = {}) {
  if (isFcmConfigured()) {
    const result = await enableFcmPush({ userType });
    if (result.ok) return { status: 'granted' };
    if (result.reason === 'denied') return { status: 'denied' };
    if (result.reason === 'unsupported') return { status: 'unsupported' };
    return { status: 'failed', reason: result.reason || 'unknown' };
  }
  const permission = await requestPushPermission();
  return { status: permission };
}

export function showBrowserNotification(title, { body = '', link = '', tag = '' } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(title, {
      body,
      tag: tag || title,
      icon: '/icon.svg',
      badge: '/favicon.svg'
    });
    if (link) {
      n.onclick = () => {
        window.focus();
        window.location.href = link;
        n.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}

/** Show push for new unread notifications when tab is open (FCM handles background). */
export function pushForNewNotifications(notifications = [], prevIds = new Set()) {
  if (isFcmConfigured()) return;
  if (Notification.permission !== 'granted') return;
  notifications
    .filter((n) => !n.read && !prevIds.has(n.id))
    .slice(0, 3)
    .forEach((n) => showBrowserNotification(n.title, { body: n.body, link: n.link, tag: n.id }));
}

export { tryRefreshFcmToken };
