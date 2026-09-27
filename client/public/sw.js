const CACHE_NAME = 'shiftaura-v2';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-96.png',
  '/shiftaura_logo.png',
];

// 1. Install Event — Pre-cache core app shell and branding assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Asset pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event — Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Web Push Event — Background notification delivery, grouping, and call alerts
self.addEventListener('push', (event) => {
  let payload = {
    title: 'ShiftAura',
    body: 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
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

  const data = payload.data || {};
  const notifTag = payload.tag || (data.conversationId ? `chat-${data.conversationId}` : (data.callId ? `call-${data.callId}` : 'shiftaura-notification'));
  const isIncomingCall = data.type === 'CALL_INCOMING';
  const isCallCancelled = data.type === 'CALL_CANCELLED';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      // 3.1 Deduplication check:
      // If user is actively focused on the specific chat conversation, suppress the duplicate OS message push
      if (data.type === 'MESSAGE' && data.conversationId) {
        const isChatOpenAndFocused = clientList.some((client) => {
          return client.focused && client.url.includes(data.conversationId);
        });
        if (isChatOpenAndFocused) {
          return;
        }
      }

      // If incoming call is cancelled by caller while ringing in background:
      // Close the hanging ringing notification
      if (isCallCancelled && data.callId) {
        const activeNotifs = await self.registration.getNotifications({ tag: `call-${data.callId}` });
        for (const notif of activeNotifs) {
          notif.close();
        }
      }

      // 3.2 Intelligent message grouping / collapsing:
      // If multiple unread messages arrive from the same conversation/person, update unread count
      let notificationBody = payload.body || 'New activity on ShiftAura';
      let notificationCount = 1;

      if (data.type === 'MESSAGE' && data.conversationId) {
        try {
          const existingNotifs = await self.registration.getNotifications({ tag: notifTag });
          if (existingNotifs && existingNotifs.length > 0) {
            const priorCount = existingNotifs[0].data?.count || 1;
            notificationCount = priorCount + 1;
            const senderName = data.senderName || payload.title || 'New message';
            notificationBody = `${notificationCount} new messages from ${senderName}`;
          }
        } catch (e) {
          console.warn('[ServiceWorker] Error checking existing notifications:', e);
        }
      }

      // Configure notification options with actions and vibration
      const notificationOptions = {
        body: notificationBody,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/badge-96.png',
        tag: notifTag,
        renotify: true,
        requireInteraction: isIncomingCall, // Persist on screen until answered/declined
        vibrate: payload.vibrate || (isIncomingCall ? [300, 200, 300, 200, 500] : [120, 60, 120]),
        data: {
          ...data,
          count: notificationCount,
          url: data.url || '/',
        },
        actions: payload.actions || (data.type === 'MESSAGE' ? [
          { action: 'open', title: 'Open' },
          { action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type a reply...' },
        ] : []),
      };

      return self.registration.showNotification(payload.title || 'ShiftAura', notificationOptions);
    })
  );
});

// 4. Notification Click & Action Routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  // Handle action buttons
  if (event.action === 'accept' && data.callId) {
    targetUrl = `/calls?callId=${data.callId}&autoAccept=true`;
  } else if (event.action === 'decline' && data.callId) {
    // Decline simply dismisses the notification
    return;
  } else if (event.action === 'callback' && data.callerId) {
    targetUrl = `/calls?callWith=${data.callerId}&type=${data.callType || 'video'}`;
  } else if (event.action === 'reply' && data.conversationId) {
    targetUrl = `/chat?conversationId=${data.conversationId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          // If inline reply text was entered by user
          if (event.reply && 'postMessage' in client) {
            client.postMessage({
              type: 'NOTIFICATION_INLINE_REPLY',
              conversationId: data.conversationId,
              text: event.reply,
            });
          }
          return client.focus();
        }
      }
      // Otherwise open a new standalone window
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

  // Cache-first for local static fonts, icons, and official brand assets
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.webmanifest'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
        );
      })
    );
  }
});
