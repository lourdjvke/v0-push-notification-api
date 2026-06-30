'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';

export default function SendOneDonePage() {
  const [email, setEmail] = useState('');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 2]));

  async function handleLoadKeys() {
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setLoadingKeys(true);
      const response = await fetch(`/api/keys?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setApiKeys(data.keys || []);
      if (data.keys?.length > 0) {
        setSelectedKey(data.keys[0].key);
      }
    } catch (error) {
      toast.error('Failed to load API keys');
      console.error(error);
    } finally {
      setLoadingKeys(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function toggleStep(index: number) {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';

  const basicNotificationCode = `fetch('${baseUrl}/api/send?apikey=${selectedKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_xxx', 'sub_yyy'], // Add subscription IDs
    notification: {
      title: 'Hello World',
      body: 'This is a basic notification'
    }
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))`;

  const buttonNotificationCode = `fetch('${baseUrl}/api/send?apikey=${selectedKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_xxx'],
    notification: {
      title: 'Take Action',
      body: 'Click the button below',
      actions: [
        {
          action: 'open',
          title: 'Open Now'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ],
      data: {
        url: 'https://example.com/offer'
      }
    }
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))`;

  const imageNotificationCode = `fetch('${baseUrl}/api/send?apikey=${selectedKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_xxx'],
    notification: {
      title: 'Special Offer',
      body: 'Check out this amazing deal!',
      image: 'https://example.com/promo.jpg',
      badge: 'https://example.com/badge.png',
      icon: 'https://example.com/icon.png'
    }
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))`;

  const fullStackNotificationCode = `fetch('${baseUrl}/api/send?apikey=${selectedKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_xxx'],
    notification: {
      title: 'Limited Time Offer',
      body: 'Get 30% off your next purchase!',
      image: 'https://example.com/banner.jpg',
      badge: 'https://example.com/badge.png',
      icon: 'https://example.com/icon.png',
      actions: [
        {
          action: 'shop',
          title: 'Shop Now'
        },
        {
          action: 'later',
          title: 'Remind Me Later'
        }
      ],
      data: {
        url: 'https://example.com/offer',
        offerCode: 'SAVE30'
      }
    }
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))`;

  const successResponse = `{
  "message": "Sent 1 notification(s)",
  "result": {
    "successful": 1,
    "failed": 0,
    "errors": []
  }
}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Send Notifications - One Done Setup</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Complete 3-step guide to send push notifications from your application
          </p>
        </div>

        {/* Configuration */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Step 0: Configure Your Setup</CardTitle>
            <CardDescription>Enter your email and select your API key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Email</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLoadKeys();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleLoadKeys} disabled={loadingKeys} className="w-full sm:w-auto">
                  {loadingKeys ? 'Loading...' : 'Load Keys'}
                </Button>
              </div>
            </div>

            {apiKeys.length > 0 && (
              <div>
                <label className="text-sm font-medium">Select API Key</label>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.key}>
                      {key.name} ({key.key?.substring(0, 10)}...)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedKey && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Your API Key:</div>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  <code className="flex-1 text-xs bg-background p-2 rounded break-all">
                    {selectedKey}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedKey)}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 1 */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleStep(1)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 1: Get Subscription IDs</CardTitle>
                <CardDescription>
                  First, you need subscription IDs from your subscribers
                </CardDescription>
              </div>
              {expandedSteps.has(1) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSteps.has(1) && (
            <CardContent className="space-y-4">
              <p className="text-sm">
                When users subscribe using the subscription endpoint, they receive a subscription ID. You need to collect and store these IDs.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-2">Example subscription response:</p>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`{
  "message": "Successfully subscribed to push notifications",
  "subscriptionId": "sub_1704067200000_a1b2c3d4e",
  "subscription": { ... }
}`}
                </pre>
              </div>
              <p className="text-sm">
                Store the <code className="bg-muted px-2 py-1 rounded text-xs">subscriptionId</code> values in your database.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleStep(2)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 2: Choose Notification Type & Copy Code</CardTitle>
                <CardDescription>
                  Select the type of notification you want to send
                </CardDescription>
              </div>
              {expandedSteps.has(2) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSteps.has(2) && (
            <CardContent className="space-y-6">
              {/* Basic Notification */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Type 1: Basic Notification</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Simple title and body only
                </p>
                <div className="bg-muted p-4 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-muted-foreground">JavaScript</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(basicNotificationCode)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto">{basicNotificationCode}</pre>
                </div>
              </div>

              {/* Button Notification */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Type 2: Notification with Buttons</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add action buttons for user interaction
                </p>
                <div className="bg-muted p-4 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-muted-foreground">JavaScript</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(buttonNotificationCode)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto">{buttonNotificationCode}</pre>
                </div>
              </div>

              {/* Image Notification */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Type 3: Notification with Image</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Include images, badges, and icons for visual appeal
                </p>
                <div className="bg-muted p-4 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-muted-foreground">JavaScript</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(imageNotificationCode)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto">{imageNotificationCode}</pre>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Type 4: Full Stack - Image + Buttons */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleStep(4)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Type 4: Full Stack (Image + Buttons + Data)</CardTitle>
                <CardDescription>
                  Everything combined - most engaging notifications
                </CardDescription>
              </div>
              {expandedSteps.has(4) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSteps.has(4) && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Combine images, buttons, and custom data for maximum engagement
              </p>
              <div className="bg-muted p-4 rounded-lg mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-muted-foreground">JavaScript</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(fullStackNotificationCode)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto">{fullStackNotificationCode}</pre>
              </div>
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">What users see:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-900">
                  <li>Large image banner</li>
                  <li>Title and body text</li>
                  <li>Two action buttons (Shop Now, Remind Me Later)</li>
                  <li>Badge icon</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleStep(3)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 3: Handle the Response</CardTitle>
                <CardDescription>
                  What you'll receive when sending is successful
                </CardDescription>
              </div>
              {expandedSteps.has(3) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          {expandedSteps.has(3) && (
            <CardContent className="space-y-4">
              <p className="text-sm">
                After sending, you'll receive a JSON response with the results:
              </p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-muted-foreground">JSON Response</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(successResponse)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
                  {successResponse}
                </pre>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>successful:</strong> Number of notifications sent successfully
                </p>
                <p>
                  <strong>failed:</strong> Number of notifications that failed
                </p>
                <p>
                  <strong>errors:</strong> Array of error messages if any failed
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tips */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Tips & Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            <p>
              ✓ Replace 'sub_xxx' with actual subscription IDs from your database
            </p>
            <p>
              ✓ Use HTTPS URLs for images and badges
            </p>
            <p>
              ✓ Keep titles under 50 characters for best display
            </p>
            <p>
              ✓ Test with a single subscription first before bulk sending
            </p>
            <p>
              ✓ Provide meaningful action buttons with clear labels
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <a href="/one-done" className="block">
            <Card className="hover:bg-muted/50 cursor-pointer">
              <CardContent className="pt-6">
                <p className="font-medium">Setup Guide</p>
                <p className="text-sm text-muted-foreground">How to get subscriptions</p>
              </CardContent>
            </Card>
          </a>
          <a href="/dashboard" className="block">
            <Card className="hover:bg-muted/50 cursor-pointer">
              <CardContent className="pt-6">
                <p className="font-medium">Dashboard</p>
                <p className="text-sm text-muted-foreground">Bulk notify all subscribers</p>
              </CardContent>
            </Card>
          </a>
        </div>
      </div>
    </div>
  );
}
