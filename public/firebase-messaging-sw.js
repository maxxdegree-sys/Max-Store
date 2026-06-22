/* Firebase Cloud Messaging service worker — works in Vite dev and production. */
importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

(function () {
  if (!self.FIREBASE_CONFIG || !self.FIREBASE_CONFIG.apiKey || typeof firebase === 'undefined') return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(self.FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
      var title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'Maxx';
      var body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '';
      var link = (payload.data && payload.data.link) || '/';
      self.registration.showNotification(title, {
        body: body,
        icon: '/icon.svg',
        badge: '/favicon.svg',
        tag: (payload.data && payload.data.notificationId) || title,
        data: { link: link }
      });
    });
  } catch (e) {
    console.warn('[firebase-messaging-sw]', e);
  }
})();

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var raw = (event.notification.data && event.notification.data.link) || '/';
  var url = raw.indexOf('http') === 0 ? raw : new URL(raw, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var client = list[i];
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
