/**
 * Service Worker for handling push notifications
 */

// Handle push events
self.addEventListener('push', event => {
  console.log('[v0] Push event received:', event);
  
  let notificationData = {
    title: 'Notification',
    body: 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag || 'default',
      data: notificationData.data || {},
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('[v0] Notification clicked:', event);
  event.notification.close();

  // Handle click based on data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if any window is already open with the target URL
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
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
