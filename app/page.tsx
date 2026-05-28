'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  isPushNotificationSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push-client';

interface Subscription {
  id: string;
  deviceName: string;
  subscribedAt: string;
  endpoint: string;
}

interface TestNotification {
  subscriptionId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export default function Page() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [deviceName, setDeviceName] = useState('My Device');
  const [vapidKey, setVapidKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [apiKey, setApiKey] = useState('test-api-key-12345');
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testBody, setTestBody] = useState('This is a test push notification');

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        // Register service worker
        await registerServiceWorker();

        // Get VAPID public key
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        setVapidKey(configData.vapidPublicKey);

        // Check current subscription
        const subscription = await getCurrentSubscription();
        if (subscription) {
          setIsSubscribed(true);
          // Try to get subscription ID from localStorage
          const savedId = localStorage.getItem('subscriptionId');
          if (savedId) {
            setCurrentSubscriptionId(savedId);
          }
        }

        // Load all subscriptions
        await loadSubscriptions();
      }
    };

    init();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscribe', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const data = await res.json();
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('[v0] Failed to load subscriptions:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!vapidKey) {
        throw new Error('VAPID key not loaded');
      }

      // Subscribe to push
      const subscription = await subscribeToPush(vapidKey);
      if (!subscription) {
        throw new Error('Failed to subscribe');
      }

      // Send subscription to server
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      setCurrentSubscriptionId(data.subscriptionId);
      localStorage.setItem('subscriptionId', data.subscriptionId);
      setIsSubscribed(true);
      setMessage(`✓ Successfully subscribed! ID: ${data.subscriptionId}`);

      // Reload subscriptions
      await loadSubscriptions();
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
      console.error('[v0] Subscribe error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage('');

    try {
      const id = currentSubscriptionId || localStorage.getItem('subscriptionId');
      if (!id) {
        throw new Error('No subscription ID found');
      }

      // Unsubscribe from push
      const unsubscribed = await unsubscribeFromPush();
      if (!unsubscribed) {
        throw new Error('Failed to unsubscribe from browser');
      }

      // Delete from server
      const res = await fetch(`/api/unsubscribe?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete subscription from server');
      }

      setIsSubscribed(false);
      setCurrentSubscriptionId(null);
      localStorage.removeItem('subscriptionId');
      setMessage('✓ Successfully unsubscribed');

      // Reload subscriptions
      await loadSubscriptions();
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
      console.error('[v0] Unsubscribe error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!currentSubscriptionId) {
        throw new Error('No subscription ID found');
      }

      const res = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          subscriptionId: currentSubscriptionId,
          notification: {
            title: testTitle,
            body: testBody,
            icon: '/icon.png',
            badge: '/badge.png',
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setMessage(`✓ Notification sent! (${data.result.successful} successful)`);
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
      console.error('[v0] Send test error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Push Notifications Not Supported</CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p>Your browser does not support Web Push Notifications.</p>
              <p className="mt-2 text-sm">
                Supported browsers: Chrome, Firefox, Edge, Safari (16+), Opera
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Push Notification Service</h1>
          <p className="text-slate-600">Subscribe to receive push notifications and test the service</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle>Device Subscription</CardTitle>
              <CardDescription>
                {isSubscribed ? '✓ Subscribed' : 'Not subscribed'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Name
                </label>
                <Input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="My Device"
                  disabled={isSubscribed}
                />
              </div>

              {currentSubscriptionId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subscription ID
                  </label>
                  <div className="p-3 bg-slate-100 rounded text-sm font-mono text-slate-700 break-all">
                    {currentSubscriptionId}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSubscribe}
                  disabled={isSubscribed || loading}
                  className="flex-1"
                >
                  {loading ? 'Loading...' : isSubscribed ? 'Already Subscribed' : 'Subscribe'}
                </Button>
                <Button
                  onClick={handleUnsubscribe}
                  disabled={!isSubscribed || loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? 'Loading...' : 'Unsubscribe'}
                </Button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded text-sm ${
                    message.startsWith('✓')
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Notification Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send Test Notification</CardTitle>
              <CardDescription>
                Send a test notification to your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  placeholder="API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Title
                </label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Test Notification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Body
                </label>
                <Textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder="This is a test push notification"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSendTest}
                disabled={!isSubscribed || loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Registered Subscriptions</CardTitle>
            <CardDescription>
              All devices subscribed to notifications ({subscriptions.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-slate-600">No subscriptions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 font-medium text-slate-700">Device</th>
                      <th className="text-left py-2 font-medium text-slate-700">Subscription ID</th>
                      <th className="text-left py-2 font-medium text-slate-700">Subscribed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">{sub.deviceName}</td>
                        <td className="py-3 font-mono text-xs text-slate-600 max-w-xs truncate">
                          {sub.id}
                        </td>
                        <td className="py-3 text-xs text-slate-600">
                          {new Date(sub.subscribedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
