'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BASE_URL = 'https://v0-push-notification-api.vercel.app';
const TEST_API_KEY = 'test-api-key-12345';

export default function DemoPage() {
  const [subscriptionId, setSubscriptionId] = useState('');
  const [apiKey, setApiKey] = useState(TEST_API_KEY);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Basic notification state
  const [basicTitle, setBasicTitle] = useState('Hello World');
  const [basicBody, setBasicBody] = useState('This is a simple notification');

  // Notification with buttons
  const [buttonTitle, setButtonTitle] = useState('Order Shipped');
  const [buttonBody, setButtonBody] = useState('Your order #12345 is on the way');
  const [buttonUrl1, setButtonUrl1] = useState('https://example.com/orders/12345');
  const [buttonUrl2, setButtonUrl2] = useState('https://tracker.example.com/12345');

  // Notification with image
  const [imageTitle, setImageTitle] = useState('New Product');
  const [imageBody, setImageBody] = useState('Check out our latest item');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop');

  // Complete example
  const [completeTitle, setCompleteTitle] = useState('Payment Confirmed');
  const [completeBody, setCompleteBody] = useState('Your payment of $99.99 has been processed');
  const [completeImage, setCompleteImage] = useState('https://images.unsplash.com/photo-1563986768711-b3bcc3a1a7a7?w=500&h=300&fit=crop');

  const sendNotification = async (notification: any) => {
    if (!subscriptionId) {
      setMessage('Please enter a subscription ID from the dashboard');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${BASE_URL}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          subscriptionId,
          notification,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Success! Sent notification to your device.`);
      } else {
        setMessage(`Error: ${data.error || 'Failed to send notification'}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Interactive Demo</h1>
            <nav className="flex gap-2">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 rounded"
              >
                Dashboard
              </a>
              <a
                href="/setup"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
              >
                Setup
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set your subscription ID to send test notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subscription ID
              </label>
              <Input
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="sub_xxxxx (from dashboard)"
              />
              <p className="text-xs text-slate-600 mt-1">
                Get this from the Dashboard after subscribing your device
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key
              </label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="test-api-key-12345"
              />
            </div>
            {message && (
              <div
                className={`p-3 rounded text-sm ${
                  message.startsWith('Success')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Examples */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>

          {/* Basic Notification */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Notification</CardTitle>
                <CardDescription>Simple title and message notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <Input
                    value={basicTitle}
                    onChange={(e) => setBasicTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                  <Textarea
                    value={basicBody}
                    onChange={(e) => setBasicBody(e.target.value)}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <div className="bg-white border rounded p-4 shadow-sm">
                    <p className="font-semibold text-sm">{basicTitle || 'Title'}</p>
                    <p className="text-sm text-slate-600">{basicBody || 'Body'}</p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    sendNotification({
                      title: basicTitle,
                      body: basicBody,
                    })
                  }
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification with Buttons */}
          <TabsContent value="buttons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>With Action Buttons</CardTitle>
                <CardDescription>Interactive buttons that users can click</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <Input
                    value={buttonTitle}
                    onChange={(e) => setButtonTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                  <Textarea
                    value={buttonBody}
                    onChange={(e) => setButtonBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Button 1 URL
                  </label>
                  <Input
                    value={buttonUrl1}
                    onChange={(e) => setButtonUrl1(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Button 2 URL
                  </label>
                  <Input
                    value={buttonUrl2}
                    onChange={(e) => setButtonUrl2(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Preview */}
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <div className="bg-white border rounded p-4 shadow-sm">
                    <p className="font-semibold text-sm">{buttonTitle || 'Title'}</p>
                    <p className="text-sm text-slate-600 mb-3">{buttonBody || 'Body'}</p>
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded">
                        View Order
                      </button>
                      <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded">
                        Track Package
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    sendNotification({
                      title: buttonTitle,
                      body: buttonBody,
                      actions: [
                        { id: 'action1', title: 'View Order' },
                        { id: 'action2', title: 'Track Package' },
                      ],
                      data: {
                        actionUrls: {
                          action1: buttonUrl1,
                          action2: buttonUrl2,
                        },
                      },
                    })
                  }
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification with Image */}
          <TabsContent value="image" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>With Image</CardTitle>
                <CardDescription>Rich notification with large image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <Input
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                  <Textarea
                    value={imageBody}
                    onChange={(e) => setImageBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Preview */}
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <div className="bg-white border rounded overflow-hidden shadow-sm">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Notification"
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-sm">{imageTitle || 'Title'}</p>
                      <p className="text-sm text-slate-600">{imageBody || 'Body'}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    sendNotification({
                      title: imageTitle,
                      body: imageBody,
                      image: imageUrl,
                      icon: '/icon.png',
                      badge: '/badge.png',
                    })
                  }
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complete Example */}
          <TabsContent value="complete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Feature Example</CardTitle>
                <CardDescription>Notification with all features combined</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <Input
                    value={completeTitle}
                    onChange={(e) => setCompleteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                  <Textarea
                    value={completeBody}
                    onChange={(e) => setCompleteBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                  <Input
                    value={completeImage}
                    onChange={(e) => setCompleteImage(e.target.value)}
                  />
                </div>

                {/* Preview */}
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <div className="bg-white border rounded overflow-hidden shadow-sm">
                    {completeImage && (
                      <img
                        src={completeImage}
                        alt="Notification"
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-sm">{completeTitle || 'Title'}</p>
                      <p className="text-sm text-slate-600 mb-3">{completeBody || 'Body'}</p>
                      <div className="flex gap-2">
                        <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded">
                          View Receipt
                        </button>
                        <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded">
                          Get Help
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    sendNotification({
                      title: completeTitle,
                      body: completeBody,
                      image: completeImage,
                      icon: '/icon.png',
                      badge: '/badge.png',
                      actions: [
                        { id: 'receipt', title: 'View Receipt' },
                        { id: 'support', title: 'Get Help' },
                      ],
                      data: {
                        actionUrls: {
                          receipt: 'https://example.com/receipt',
                          support: 'https://example.com/support',
                        },
                      },
                      requireInteraction: true,
                    })
                  }
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Use This Demo</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 text-sm space-y-2">
            <p>
              1. Go to the <a href="/" className="underline font-medium">Dashboard</a> and subscribe your device
            </p>
            <p>2. Copy your subscription ID from the dashboard</p>
            <p>3. Paste it above and try sending different notification types</p>
            <p>4. Check your device for the notifications</p>
            <p>
              For more advanced usage, see the <a href="/setup" className="underline font-medium">Setup Guide</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
