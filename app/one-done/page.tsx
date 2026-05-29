'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const SW_JS_CONTENT = `/**
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

  if (Array.isArray(notificationData.actions) && notificationData.actions.length > 0) {
    options.actions = notificationData.actions.map((action) => ({
      action: String(action.id || action.action || 'default'),
      title: String(action.title || 'Action'),
      icon: action.icon || undefined,
    })).filter(a => a);
  }

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

  if (event.action) {
    const actionUrl = event.notification.data?.actionUrls?.[event.action];
    if (actionUrl) {
      event.waitUntil(clients.matchAll({ type: 'window' }).then(clientList => {
        if (clients.openWindow) return clients.openWindow(actionUrl);
      }));
      return;
    }

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

self.addEventListener('notificationclose', event => {
  console.log('Notification closed');
});

self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
});
`;

const SUBSCRIBE_CODE = `// Step 1: Get VAPID public key
const response = await fetch('BASE_URL/api/vapid', { method: 'GET' });
const { publicKey } = await response.json();

// Step 2: Register service worker
const registration = await navigator.serviceWorker.register('/sw.js');

// Step 3: Request notification permission
const permission = await Notification.requestPermission();
if (permission !== 'granted') {
  throw new Error('Notification permission denied');
}

// Step 4: Create push subscription
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: publicKey,
});

// Step 5: Send to our API
const subscriptionResponse = await fetch('BASE_URL/api/subscribe?apikey=API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceName: navigator.userAgent.substring(0, 100),
    apikey: 'API_KEY',
  }),
});

const result = await subscriptionResponse.json();
console.log('Subscription successful:', result.subscriptionId);`;

export default function OnedonePage() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>('step1');

  const handleCopy = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const filledSwContent = SW_JS_CONTENT;
  
  const filledSubscribeCode = SUBSCRIBE_CODE
    .replace(/BASE_URL/g, baseUrl || 'https://your-api.vercel.app')
    .replace(/API_KEY/g, apiKey || 'sk_your_api_key_here');

  const expectedResponse = {
    message: 'Successfully subscribed to push notifications',
    subscriptionId: 'sub_1234567890_abcdefghij',
    subscription: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/...',
      keys: {
        auth: 'auth_key_here',
        p256dh: 'p256dh_key_here',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Push Notifications Setup</h1>
          <p className="text-lg text-slate-600">Complete setup in 3 simple steps</p>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">API Key *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_your_api_key_here"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                />
                <button
                  onClick={() => handleCopy(apiKey, 'apikey')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Copy API Key"
                >
                  {copiedStep === 'apikey' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Get your API key from the dashboard</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Base URL *</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-api.vercel.app"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">The base URL of this push notification API</p>
            </div>
          </div>
        </div>

        {/* 3-Step Guide */}
        <div className="space-y-4">
          {/* Step 1: Service Worker */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 'step1' ? null : 'step1')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full font-bold text-blue-600">
                  1
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-900">Create Service Worker</h3>
                  <p className="text-sm text-slate-600">Add sw.js to your project root</p>
                </div>
              </div>
              {expandedStep === 'step1' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {expandedStep === 'step1' && (
              <div className="px-6 pb-6 border-t border-slate-200">
                <div className="mb-4">
                  <p className="text-sm text-slate-700 mb-3">
                    Create a file called <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">sw.js</code> in your project root:
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      {filledSwContent}
                    </pre>
                    <button
                      onClick={() => handleCopy(filledSwContent, 'step1')}
                      className="absolute top-3 right-3 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      {copiedStep === 'step1' ? (
                        <>
                          <Check className="w-4 h-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>This file handles incoming push notifications and displays them to users.</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Subscribe Endpoint Usage */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 'step2' ? null : 'step2')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full font-bold text-blue-600">
                  2
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-900">Subscribe User</h3>
                  <p className="text-sm text-slate-600">Call subscribe endpoint from your app</p>
                </div>
              </div>
              {expandedStep === 'step2' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {expandedStep === 'step2' && (
              <div className="px-6 pb-6 border-t border-slate-200">
                <div className="mb-4">
                  <p className="text-sm text-slate-700 mb-3">
                    Call this from your JavaScript code when user clicks "Enable Notifications":
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      {filledSubscribeCode}
                    </pre>
                    <button
                      onClick={() => handleCopy(filledSubscribeCode, 'step2')}
                      className="absolute top-3 right-3 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      {copiedStep === 'step2' ? (
                        <>
                          <Check className="w-4 h-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  <p className="font-semibold mb-1">What this does:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Gets VAPID public key from API</li>
                    <li>Registers your service worker</li>
                    <li>Requests browser permission</li>
                    <li>Creates push subscription</li>
                    <li>Sends it to our server</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Expected Response */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 'step3' ? null : 'step3')}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full font-bold text-blue-600">
                  3
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-900">Handle Response</h3>
                  <p className="text-sm text-slate-600">What you get back on success</p>
                </div>
              </div>
              {expandedStep === 'step3' ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {expandedStep === 'step3' && (
              <div className="px-6 pb-6 border-t border-slate-200">
                <div className="mb-4">
                  <p className="text-sm text-slate-700 mb-3">
                    If successful, you'll get a subscription ID. Store it to send notifications later:
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      {JSON.stringify(expectedResponse, null, 2)}
                    </pre>
                    <button
                      onClick={() => handleCopy(JSON.stringify(expectedResponse, null, 2), 'step3')}
                      className="absolute top-3 right-3 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center gap-2 transition-colors"
                    >
                      {copiedStep === 'step3' ? (
                        <>
                          <Check className="w-4 h-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
                  <p className="font-semibold mb-1">Success!</p>
                  <p>Save the <code className="bg-green-100 px-1 rounded">subscriptionId</code> to send notifications to this device.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-slate-100 rounded-lg p-6 text-center">
          <p className="text-slate-700 text-sm">
            Need help? Check the dashboard for API keys, analytics, and sending notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
