const CACHE_NAME = 'shiftaura-v1';
const STATIC_ASSETS = ['/', '/favicon.svg', '/manifest.webmanifest'];

// 1. Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// 2. Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Web Push Event
self.addEventListener('push', (event) => {
  let payload = {
    title: 'ShiftAura',
    body: 'You have a new update.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'shiftaura-notification',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body || 'New activity on ShiftAura',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'shiftaura-notification',
    renotify: true,
    data: payload.data || { url: '/' },
    vibrate: payload.vibrate || [100, 50, 100],
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Deduplication: If the app window is actively focused and open,
      // the real-time Socket.IO handler updates the UI directly.
      const isAppFocused = clientList.some((client) => client.focused);

      if (isAppFocused) {
        return;
      }

      return self.registration.showNotification(payload.title || 'ShiftAura', notificationOptions);
    })
  );
});

// 4. Notification Click Routing Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  // Handle action buttons
  if (event.action === 'accept' && data.callId) {
    targetUrl = `/calls?callId=${data.callId}&autoAccept=true`;
  } else if (event.action === 'decline' && data.callId) {
    // Decline action simply dismisses notification
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. Fetch Event — Network-first for dynamic navigation and API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API or Socket requests
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // Network-first with cache fallback for static app shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for local static fonts and icons
  if (url.origin === self.location.origin && (url.pathname.endsWith('.svg') || url.pathname.endsWith('.png'))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      })
    );
  }
});
