/**
 * Service Worker for handling push notifications
 */

// Handle push events
self.addEventListener('push', event => {
  let notificationData = {
    title: 'Notification',
    body: 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: 'notification',
    requireInteraction: false,
    actions: [],
    data: {},
  };

  if (event.data) {
    try {
      const parsedData = event.data.json();
      notificationData = { ...notificationData, ...parsedData };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Ensure title and body are valid strings
  const title = String(notificationData.title || 'Notification');
  const body = String(notificationData.body || 'You have a new message');

  const options = {
    body: body,
    icon: notificationData.icon || '/icon.png',
    badge: notificationData.badge || '/badge.png',
    tag: notificationData.tag || 'notification',
    requireInteraction: Boolean(notificationData.requireInteraction),
    data: notificationData.data || {},
  };

  // Add custom actions/buttons if provided
  if (Array.isArray(notificationData.actions) && notificationData.actions.length > 0) {
    options.actions = notificationData.actions.map((action) => ({
      action: String(action.id || action.action || 'default'),
      title: String(action.title || 'Action'),
      icon: action.icon || undefined,
    })).filter(a => a);
  }

  // Add optional fields
  if (notificationData.image) options.image = notificationData.image;
  if (notificationData.vibrate) options.vibrate = notificationData.vibrate;
  if (notificationData.silent !== undefined) options.silent = notificationData.silent;
  if (notificationData.timestamp) options.timestamp = notificationData.timestamp;

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Handle action button clicks
  if (event.action) {
    const actionUrl = event.notification.data?.actionUrls?.[event.action];
    if (actionUrl) {
      event.waitUntil(clients.matchAll({ type: 'window' }).then(clientList => {
        if (clients.openWindow) return clients.openWindow(actionUrl);
      }));
      return;
    }

    // Send action to client if it's open
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: event.action,
            data: event.notification.data,
          });
        });
      })
    );
    return;
  }

  // Handle main notification click
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[v0] Notification closed:', event);
});

// Handle messages from clients
self.addEventListener('message', event => {
  console.log('[v0] Service Worker received message:', event.data);
});
