'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';

const SW_CODE = `// Save this file as public/sw.js in your project
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
    options.actions = notificationData.actions.map(action => ({
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
});`;

const REGISTER_CODE = `// Save this as lib/push-client.ts in your project

export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error) {
    console.error('[v0] SW registration failed:', error);
    return null;
  }
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    return subscription;
  } catch (error) {
    console.error('[v0] Push subscription failed:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? await subscription.unsubscribe() : false;
  } catch (error) {
    console.error('[v0] Unsubscribe failed:', error);
    return false;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[v0] Get subscription failed:', error);
    return null;
  }
}`;

export default function SetupPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copied === id ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Installation & Setup Guide
          </h1>
          <p className="text-slate-600">
            Get push notifications working in your application in 5 minutes
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="integrate">Integrate</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Understanding the push notification flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">User Subscribes</h3>
                      <p className="text-slate-600 text-sm">
                        User clicks "Subscribe" on your website. Browser registers service worker and enables push.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Data Stored</h3>
                      <p className="text-slate-600 text-sm">
                        Subscription endpoint is saved to Firebase Realtime Database with a unique ID.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Send Notification</h3>
                      <p className="text-slate-600 text-sm">
                        You send a POST request to /api/send with the subscription ID and notification details.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white font-bold">
                        4
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Notification Delivered</h3>
                      <p className="text-slate-600 text-sm">
                        Browser service worker receives the push notification and displays it to the user.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>HTTPS enabled (required for service workers)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Modern browser (Chrome, Firefox, Edge, Safari 16+)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>User permission for notifications</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>API Key for sending notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Add Service Worker</CardTitle>
                <CardDescription>
                  Copy the service worker code to public/sw.js
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  This file handles push events in your browser.
                </p>
                <CodeBlock code={SW_CODE} id="sw-code" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Add Push Client Library</CardTitle>
                <CardDescription>
                  Copy to lib/push-client.ts for client-side utilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Provides utility functions for managing subscriptions.
                </p>
                <CodeBlock code={REGISTER_CODE} id="register-code" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrate */}
          <TabsContent value="integrate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscribe Button Component</CardTitle>
                <CardDescription>
                  Add this to your UI to enable push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock
                  code={`'use client';
import { useState } from 'react';
import { subscribeToPush, registerServiceWorker } from '@/lib/push-client';

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await registerServiceWorker();
      
      const response = await fetch('/api/config');
      const { vapidPublicKey } = await response.json();
      
      const subscription = await subscribeToPush(vapidPublicKey);
      
      if (subscription) {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            deviceName: 'My Device',
          }),
        });
        const data = await res.json();
        console.log('Subscribed with ID:', data.subscriptionId);
      }
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Subscribing...' : 'Enable Notifications'}
    </button>
  );
}`}
                  id="subscribe-code"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Your Setup</CardTitle>
                <CardDescription>
                  Send your first notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Once you've subscribed a device, send a test notification:
                </p>
                <CodeBlock
                  code={`curl -X POST https://v0-push-notification-api.vercel.app/api/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "subscriptionId": "sub_abc123",
    "notification": {
      "title": "Test Notification",
      "body": "This is your first push notification!",
      "icon": "/icon.png"
    }
  }'`}
                  id="test-curl"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Using the Web UI</CardTitle>
                <CardDescription>
                  Test notifications through our dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                  <li>Go to https://v0-push-notification-api.vercel.app</li>
                  <li>Subscribe your device</li>
                  <li>Fill in the notification details</li>
                  <li>Click "Send Test Notification"</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 text-sm space-y-2">
            <p>
              Check the full documentation at{' '}
              <a
                href="https://v0-push-notification-api.vercel.app/docs"
                className="underline hover:no-underline"
              >
                /docs
              </a>
            </p>
            <p>
              View API examples at{' '}
              <a
                href="https://v0-push-notification-api.vercel.app/api-reference"
                className="underline hover:no-underline"
              >
                /api-reference
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
