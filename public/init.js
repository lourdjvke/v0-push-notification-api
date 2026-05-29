/**
 * Push Notification Init Script
 * 
 * Usage in external website:
 * <script src="https://yourdomain.com/api/init.js?apikey=sk_xxxxx"></script>
 * 
 * This script will:
 * 1. Request notification permission from the user
 * 2. Subscribe the device to push notifications
 * 3. Store the subscription ID locally for future use
 * 4. Handle push events
 */

(function() {
  'use strict';

  // Get API key from script URL
  const script = document.currentScript || (() => {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const scriptSrc = script.src || script.getAttribute('src') || '';
  console.log('[PushNotif] Script src:', scriptSrc);
  
  const urlParams = new URL(scriptSrc).searchParams;
  const apiKey = urlParams.get('apikey');
  const apiHost = new URL(scriptSrc).origin;

  console.log('[PushNotif] API Key:', apiKey ? 'set' : 'NOT SET');
  console.log('[PushNotif] API Host:', apiHost);

  if (!apiKey) {
    console.error('[PushNotif] API key not provided in script URL');
    console.error('[PushNotif] Script URL:', scriptSrc);
    return;
  }

  const config = {
    apiKey,
    apiHost,
    storageKey: 'push_notification_id',
    subscriptionStorageKey: 'push_subscription',
  };

  // Log initialization
  console.log('[PushNotif] Initializing push notification script');
  console.log('[PushNotif] Config:', config);

  /**
   * Check if browser supports Service Workers and Push API
   */
  function isSupported() {
    const supported = (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
    console.log('[PushNotif] Browser support check:', {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      supported,
    });
    return supported;
  }

  /**
   * Register service worker for handling push notifications
   */
  async function registerServiceWorker() {
    try {
      if (!isSupported()) {
        console.warn('[PushNotif] Push notifications not supported in this browser');
        return null;
      }

      const swPath = `${config.apiHost}/sw.js`;
      console.log('[PushNotif] Registering service worker from:', swPath);
      
      const registration = await navigator.serviceWorker.register(swPath, { scope: '/' });
      console.log('[PushNotif] Service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('[PushNotif] Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Request notification permission from user
   */
  async function requestNotificationPermission() {
    if (Notification.permission === 'granted') {
      console.log('[PushNotif] Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('[PushNotif] Notification permission denied by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PushNotif] Notification permission request result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[PushNotif] Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get or create push subscription
   */
  async function getOrCreateSubscription(registration) {
    try {
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('[PushNotif] Already subscribed');
        saveSubscriptionId(subscription);
        return subscription;
      }

      // Subscribe to push service
      console.log('[PushNotif] Creating new subscription...');
      
      // Get VAPID public key from server
      const vapidResponse = await fetch(`${config.apiHost}/api/vapid`);
      if (!vapidResponse.ok) {
        throw new Error('Failed to fetch VAPID public key');
      }
      const { publicKey } = await vapidResponse.json();

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('[PushNotif] Subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PushNotif] Error getting/creating subscription:', error);
      throw error;
    }
  }

  /**
   * Save subscription to server
   */
  async function saveSubscriptionToServer(subscription) {
    try {
      const url = `${config.apiHost}/api/subscribe?apikey=${config.apiKey}`;
      const payload = {
        subscription: subscription.toJSON(),
        deviceName: getDeviceName(),
        apikey: config.apiKey,
      };

      console.log('[PushNotif] Sending subscription to:', url);
      console.log('[PushNotif] Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[PushNotif] Subscribe response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PushNotif] Server error response:', response.status, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[PushNotif] Subscription saved to server:', data);
      localStorage.setItem(config.subscriptionStorageKey, JSON.stringify(subscription.toJSON()));
      localStorage.setItem(config.storageKey, data.subscriptionId);
      return data.subscriptionId;
    } catch (error) {
      console.error('[PushNotif] Error saving subscription to server:', error);
      console.error('[PushNotif] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get device name from user agent
   */
  function getDeviceName() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Windows') > -1) return 'Windows Device';
    if (userAgent.indexOf('Mac') > -1) return 'Mac Device';
    if (userAgent.indexOf('Android') > -1) return 'Android Device';
    if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) return 'iOS Device';
    if (userAgent.indexOf('Linux') > -1) return 'Linux Device';
    return 'Unknown Device';
  }

  /**
   * Check if API is accessible (CORS test)
   */
  async function checkApiConnection() {
    try {
      const url = `${config.apiHost}/api/connection?apikey=${config.apiKey}`;
      console.log('[PushNotif] Testing CORS with URL:', url);
      
      const response = await fetch(url, { method: 'GET' });
      
      console.log('[PushNotif] Connection response status:', response.status);
      console.log('[PushNotif] Connection response headers:', {
        corsOrigin: response.headers.get('Access-Control-Allow-Origin'),
        corsHeaders: response.headers.get('Access-Control-Allow-Headers'),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[PushNotif] API connection check passed:', data);
        return data.apiKeyValid || data.corsWorking || true;
      }
      
      const errorText = await response.text();
      console.error('[PushNotif] Connection check failed:', response.status, errorText);
      return false;
    } catch (error) {
      console.error('[PushNotif] API connection check error:', error);
      console.error('[PushNotif] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Convert VAPID public key from base64 to Uint8Array
   */
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

  /**
   * Get stored subscription ID
   */
  function getSubscriptionId() {
    return localStorage.getItem(config.storageKey);
  }

  /**
   * Save subscription ID locally
   */
  function saveSubscriptionId(subscription) {
    const subData = subscription.toJSON();
    localStorage.setItem(config.subscriptionStorageKey, JSON.stringify(subData));
  }

  /**
   * Initialize the push notification system
   */
  async function initialize() {
    try {
      console.log('[PushNotif] ===== INITIALIZATION START =====');
      
      // Check browser support
      if (!isSupported()) {
        console.warn('[PushNotif] Push notifications not supported in this browser');
        window.dispatchEvent(new CustomEvent('pushNotificationError', {
          detail: { error: 'Push notifications not supported' }
        }));
        return;
      }

      // Check API connectivity
      console.log('[PushNotif] Checking API connectivity...');
      const apiOk = await checkApiConnection();
      if (!apiOk) {
        console.error('[PushNotif] Cannot reach API server - aborting initialization');
        window.dispatchEvent(new CustomEvent('pushNotificationError', {
          detail: { error: 'Cannot reach API server' }
        }));
        return;
      }

      console.log('[PushNotif] API is reachable. Proceeding with initialization...');

      // Register service worker
      console.log('[PushNotif] Registering service worker...');
      const registration = await registerServiceWorker();
      if (!registration) {
        console.error('[PushNotif] Service worker registration failed');
        window.dispatchEvent(new CustomEvent('pushNotificationError', {
          detail: { error: 'Service worker registration failed' }
        }));
        return;
      }

      console.log('[PushNotif] Service worker registered. Requesting permission...');

      // Request permission
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('[PushNotif] User denied notification permission');
        window.dispatchEvent(new CustomEvent('pushNotificationError', {
          detail: { error: 'User denied notification permission' }
        }));
        return;
      }

      console.log('[PushNotif] Permission granted. Creating subscription...');

      // Get or create subscription
      const subscription = await getOrCreateSubscription(registration);

      // Save subscription to server
      console.log('[PushNotif] Saving subscription to server...');
      const subscriptionId = await saveSubscriptionToServer(subscription);
      
      console.log('[PushNotif] ===== INITIALIZATION SUCCESS =====');
      console.log('[PushNotif] Subscription ID:', subscriptionId);

      // Emit custom event
      window.dispatchEvent(new CustomEvent('pushNotificationReady', {
        detail: { subscriptionId }
      }));

    } catch (error) {
      console.error('[PushNotif] ===== INITIALIZATION ERROR =====');
      console.error('[PushNotif] Error:', error);
      console.error('[PushNotif] Error message:', error.message);
      console.error('[PushNotif] Error stack:', error.stack);
      
      window.dispatchEvent(new CustomEvent('pushNotificationError', {
        detail: { error: error.message }
      }));
    }
  }

  /**
   * Public API exposed to window
   */
  window.PushNotification = {
    getSubscriptionId,
    initialize,
    config,
    apiHost: config.apiHost,
    apiKey: config.apiKey,
  };

  // Auto-initialize if document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
