/**
 * Push Notification API - Vanilla JavaScript Examples
 * 
 * These are complete, production-ready examples for integrating
 * push notifications into your website using vanilla JavaScript.
 */

// ============================================================
// EXAMPLE 1: Auto-initialize with Script Tag
// ============================================================

// Simply add to your HTML:
// <script src="https://yourdomain.com/api/init.js?apikey=sk_your_api_key"></script>

// The script will automatically:
// 1. Request notification permission
// 2. Subscribe the device
// 3. Store the subscription ID locally
// 4. Emit a 'pushNotificationReady' event

// Listen for the ready event:
window.addEventListener('pushNotificationReady', (event) => {
  console.log('Push notifications ready!');
  console.log('Subscription ID:', event.detail.subscriptionId);
  // Show a success message to the user
});

// Listen for errors:
window.addEventListener('pushNotificationError', (event) => {
  console.error('Push notification error:', event.detail.error);
  // Handle the error appropriately
});


// ============================================================
// EXAMPLE 2: Programmatic Sending (Server-side - Node.js)
// ============================================================

async function sendNotificationFromServer(apiKey, subscriptionId) {
  const response = await fetch('https://yourdomain.com/api/send?apikey=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      notification: {
        title: 'Hello World',
        body: 'This is a test notification',
        icon: 'https://yourdomain.com/icon.png',
        badge: 'https://yourdomain.com/badge.png',
        image: 'https://yourdomain.com/image.png',
        tag: 'notification-1',
        requireInteraction: false,
        data: {
          url: 'https://yourdomain.com/page',
          customData: 'value'
        }
      }
    })
  });

  const result = await response.json();
  console.log('Send result:', result);
  return result;
}

// Usage:
// await sendNotificationFromServer('sk_xxx', 'sub_xxx');


// ============================================================
// EXAMPLE 3: Send to Multiple Subscriptions
// ============================================================

async function sendToMultipleSubscriptions(apiKey, subscriptionIds) {
  const response = await fetch('https://yourdomain.com/api/send?apikey=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionIds, // Array of subscription IDs
      notification: {
        title: 'Broadcast Notification',
        body: 'This goes to multiple users',
        icon: 'https://yourdomain.com/icon.png',
      }
    })
  });

  const result = await response.json();
  return result;
}


// ============================================================
// EXAMPLE 4: Send Different Notification Types
// ============================================================

// Simple notification
async function sendSimpleNotification(apiKey, subscriptionId) {
  return fetch('https://yourdomain.com/api/send?apikey=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriptionId,
      notification: {
        title: 'Simple Notification',
        body: 'Just title and body'
      }
    })
  }).then(r => r.json());
}

// With image
async function sendImageNotification(apiKey, subscriptionId) {
  return fetch('https://yourdomain.com/api/send?apikey=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriptionId,
      notification: {
        title: 'Image Notification',
        body: 'Check out this image',
        image: 'https://yourdomain.com/banner.jpg',
        icon: 'https://yourdomain.com/icon.png'
      }
    })
  }).then(r => r.json());
}

// With action buttons
async function sendActionNotification(apiKey, subscriptionId) {
  return fetch('https://yourdomain.com/api/send?apikey=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriptionId,
      notification: {
        title: 'Action Notification',
        body: 'Respond to this notification',
        actions: [
          { id: 'accept', title: 'Accept' },
          { id: 'reject', title: 'Reject' }
        ],
        data: {
          url: 'https://yourdomain.com/respond'
        },
        requireInteraction: true
      }
    })
  }).then(r => r.json());
}


// ============================================================
// EXAMPLE 5: Check CORS and API Connectivity
// ============================================================

async function checkApiConnection(apiKey) {
  try {
    const response = await fetch(
      'https://yourdomain.com/api/connection?apikey=' + apiKey,
      { method: 'GET' }
    );
    const data = await response.json();
    console.log('API Connection Check:', data);
    return data.apiKeyValid;
  } catch (error) {
    console.error('CORS or connection issue:', error);
    return false;
  }
}

// Usage:
// const isConnected = await checkApiConnection('sk_xxx');


// ============================================================
// EXAMPLE 6: Get Subscription Analytics
// ============================================================

async function getSubscriptionAnalytics(subscriptionId) {
  const response = await fetch(
    'https://yourdomain.com/api/analytics?subscriptionId=' + subscriptionId
  );
  const data = await response.json();
  
  console.log('Notifications sent:', data.stats.notificationsReceived);
  console.log('Opened:', data.stats.notificationsOpened);
  console.log('Clicked:', data.stats.notificationsClicked);
  console.log('Engagement rate:', data.engagementRate + '%');
  
  return data;
}


// ============================================================
// EXAMPLE 7: Manual Subscription Handling
// ============================================================

async function manualSubscribe(apiKey) {
  // Check browser support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications not supported');
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered');

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission denied');
      return;
    }

    // Get VAPID key
    const vapidResponse = await fetch('https://yourdomain.com/api/vapid');
    const { publicKey } = await vapidResponse.json();

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send to server
    const response = await fetch('https://yourdomain.com/api/subscribe?apikey=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceName: navigator.userAgent,
        apikey: apiKey,
      })
    });

    const data = await response.json();
    console.log('Subscription ID:', data.subscriptionId);
    
    // Save locally
    localStorage.setItem('push_subscription_id', data.subscriptionId);
    
    return data.subscriptionId;

  } catch (error) {
    console.error('Subscription error:', error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


// ============================================================
// EXAMPLE 8: React Component Example
// ============================================================

/*
import { useEffect, useState } from 'react';

export function PushNotificationButton() {
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    const saved = localStorage.getItem('push_subscription_id');
    if (saved) {
      setSubscriptionId(saved);
    }
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const id = await manualSubscribe('sk_your_api_key');
      setSubscriptionId(id);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTest() {
    if (!subscriptionId) return;
    await sendSimpleNotification('sk_your_api_key', subscriptionId);
  }

  return (
    <div>
      {!subscriptionId ? (
        <button onClick={handleSubscribe} disabled={loading}>
          {loading ? 'Subscribing...' : 'Subscribe to Notifications'}
        </button>
      ) : (
        <div>
          <p>Subscribed: {subscriptionId.slice(0, 20)}...</p>
          <button onClick={handleSendTest}>Send Test Notification</button>
        </div>
      )}
    </div>
  );
}
*/


// ============================================================
// EXAMPLE 9: Unsubscribe
// ============================================================

async function unsubscribeDevice(subscriptionId) {
  const response = await fetch(
    'https://yourdomain.com/api/unsubscribe?id=' + subscriptionId,
    { method: 'DELETE' }
  );
  return response.json();
}

// Usage:
// await unsubscribeDevice('sub_xxx');


// ============================================================
// EXAMPLE 10: Complete Integration Example
// ============================================================

class PushNotificationManager {
  constructor(apiKey, apiHost = window.location.origin) {
    this.apiKey = apiKey;
    this.apiHost = apiHost;
    this.subscriptionId = localStorage.getItem('push_subscription_id');
  }

  // Get current subscription ID
  getSubscriptionId() {
    return this.subscriptionId;
  }

  // Check API connectivity
  async checkConnection() {
    try {
      const response = await fetch(
        `${this.apiHost}/api/connection?apikey=${this.apiKey}`
      );
      const data = await response.json();
      return data.apiKeyValid;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  // Send notification
  async send(title, body, options = {}) {
    if (!this.subscriptionId) {
      throw new Error('Not subscribed');
    }

    const response = await fetch(
      `${this.apiHost}/api/send?apikey=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: this.subscriptionId,
          notification: {
            title,
            body,
            ...options
          }
        })
      }
    );

    return response.json();
  }

  // Get analytics
  async getAnalytics() {
    if (!this.subscriptionId) {
      throw new Error('Not subscribed');
    }

    const response = await fetch(
      `${this.apiHost}/api/analytics?subscriptionId=${this.subscriptionId}`
    );
    return response.json();
  }

  // Unsubscribe
  async unsubscribe() {
    if (!this.subscriptionId) {
      throw new Error('Not subscribed');
    }

    const response = await fetch(
      `${this.apiHost}/api/unsubscribe?id=${this.subscriptionId}`,
      { method: 'DELETE' }
    );
    
    localStorage.removeItem('push_subscription_id');
    this.subscriptionId = null;
    
    return response.json();
  }
}

// Usage:
// const manager = new PushNotificationManager('sk_xxx');
// await manager.send('Hello', 'World');
// const analytics = await manager.getAnalytics();
