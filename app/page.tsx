'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Plus, Trash2 } from 'lucide-react';
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

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
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
  const [copied, setCopied] = useState<string | null>(null);

  // API Key Management State
  const [email, setEmail] = useState('');
  const [keyName, setKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [manageLoading, setManageLoading] = useState(false);

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

  // API Key Management Functions
  const handleCreateKey = async () => {
    if (!email || !email.includes('@')) {
      setMessage('✗ Please enter a valid email address');
      return;
    }
    if (!keyName.trim()) {
      setMessage('✗ Please enter a key name');
      return;
    }

    setManageLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: keyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create key');
      }

      setNewKey(data);
      setMessage('✓ API key created! Save it somewhere safe.');
      setKeyName('');
      await loadApiKeys();
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const loadApiKeys = async () => {
    if (!email || !email.includes('@')) return;

    try {
      const res = await fetch(`/api/keys?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.keys) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('[v0] Failed to load API keys:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!email) return;

    setManageLoading(true);

    try {
      const res = await fetch(
        `/api/keys?email=${encodeURIComponent(email)}&keyId=${keyId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete key');
      }

      setMessage('✓ API key deleted');
      await loadApiKeys();
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Push Notification Service</h1>
          <p className="text-slate-600">Subscribe, manage API keys, and test push notifications</p>
        </div>

        <Tabs defaultValue="subscribe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="devices">Subscriptions</TabsTrigger>
          </TabsList>

          {/* Subscribe Tab */}
          <TabsContent value="subscribe" className="space-y-6">
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
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-slate-100 rounded text-xs font-mono text-slate-700 break-all">
                          {currentSubscriptionId}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(currentSubscriptionId, 'sub-id')}
                        >
                          {copied === 'sub-id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
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
                  <CardDescription>Send a test notification to your device</CardDescription>
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
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage API Keys</CardTitle>
                <CardDescription>Create and manage API keys for sending notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="your@email.com"
                      />
                      <Button onClick={loadApiKeys} variant="outline" disabled={!email}>
                        Load Keys
                      </Button>
                    </div>
                  </div>

                  {email && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Create New Key
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            placeholder="Key name (e.g., 'Production API')"
                          />
                          <Button
                            onClick={handleCreateKey}
                            disabled={manageLoading || !keyName.trim()}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Create
                          </Button>
                        </div>
                      </div>

                      {newKey && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-green-900">New API Key</p>
                              <p className="text-xs text-green-700 mt-1">
                                Save this key somewhere safe. You won't be able to see it again.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <code className="flex-1 p-2 bg-green-100 text-green-900 rounded font-mono text-sm break-all">
                              {newKey.key}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(newKey.key, 'new-key')}
                            >
                              {copied === 'new-key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                </div>

                {apiKeys.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Your API Keys</h4>
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{key.name}</p>
                          <p className="text-xs text-slate-600 font-mono">{key.key}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(key.key, `key-${key.id}`)}
                          >
                            {copied === `key-${key.id}` ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={manageLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="devices">
            <Card>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
