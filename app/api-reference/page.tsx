'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = 'https://v0-push-notification-api.vercel.app';

export default function ApiReferencePage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'bash' }: { code: string; id: string; language?: string }) => (
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

  const EndpointCard = ({
    method,
    path,
    title,
    description,
    auth,
    examples,
    requestBody,
    response,
  }: any) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-1 rounded text-white text-xs font-bold ${
              method === 'GET'
                ? 'bg-blue-500'
                : method === 'POST'
                  ? 'bg-green-500'
                  : method === 'DELETE'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
            }`}
          >
            {method}
          </span>
          <code className="bg-slate-100 px-2 py-1 rounded text-sm">{path}</code>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {auth && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Authentication</h4>
            <p className="text-sm text-slate-600 mb-2">{auth.description}</p>
            <CodeBlock code={auth.example} id={`auth-${path}`} />
          </div>
        )}

        {requestBody && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Request Body</h4>
            <CodeBlock code={requestBody} id={`req-${path}`} language="json" />
          </div>
        )}

        {response && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Response</h4>
            <CodeBlock code={response} id={`res-${path}`} language="json" />
          </div>
        )}

        {examples && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Examples</h4>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
                <TabsTrigger value="ts">TypeScript</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <CodeBlock code={examples.curl} id={`curl-${path}`} />
              </TabsContent>
              <TabsContent value="js">
                <CodeBlock code={examples.js} id={`js-${path}`} />
              </TabsContent>
              <TabsContent value="ts">
                <CodeBlock code={examples.ts} id={`ts-${path}`} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">API Reference</h1>
          <p className="text-slate-600">
            Complete API documentation for the Push Notification Service
          </p>
          <div className="mt-4 p-4 bg-slate-100 rounded-lg">
            <p className="text-sm font-mono text-slate-700">
              Base URL: <span className="font-bold">{API_BASE}</span>
            </p>
          </div>
        </div>

        {/* GET /api/config */}
        <EndpointCard
          method="GET"
          path="/api/config"
          title="Get VAPID Configuration"
          description="Retrieve the VAPID public key needed for subscribing to push notifications"
          examples={{
            curl: `curl ${API_BASE}/api/config`,
            js: `fetch('${API_BASE}/api/config')
  .then(res => res.json())
  .then(data => console.log(data.vapidPublicKey))`,
            ts: `const response = await fetch('${API_BASE}/api/config');
const { vapidPublicKey } = await response.json();
console.log('Public Key:', vapidPublicKey);`,
          }}
          response={JSON.stringify(
            {
              vapidPublicKey:
                'BGLbLfrYWC5npSRnE1QrNXZQrvnlkLommK6OvZUeUNrNKpFbKTFQkLvT0_19CiYeXsHGMs7DdAGPErC25BLTaPA',
            },
            null,
            2
          )}
        />

        {/* POST /api/subscribe */}
        <EndpointCard
          method="POST"
          path="/api/subscribe"
          title="Subscribe Device to Push Notifications"
          description="Register a device to receive push notifications. The subscription endpoint is stored securely."
          requestBody={JSON.stringify(
            {
              subscription: {
                endpoint: 'https://fcm.googleapis.com/fcm/send/...',
                keys: {
                  p256dh: 'BN...',
                  auth: 'iD...',
                },
              },
              deviceName: 'My Device',
            },
            null,
            2
          )}
          response={JSON.stringify(
            {
              success: true,
              subscriptionId: 'sub_a1b2c3d4e5f6g7h8',
              message: 'Device subscribed successfully',
            },
            null,
            2
          )}
          examples={{
            curl: `curl -X POST ${API_BASE}/api/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "BN...",
        "auth": "iD..."
      }
    },
    "deviceName": "My iPhone"
  }'`,
            js: `const response = await fetch('${API_BASE}/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceName: 'My Device'
  })
});
const data = await response.json();
console.log('Subscription ID:', data.subscriptionId);`,
            ts: `interface SubscribePayload {
  subscription: PushSubscriptionJSON;
  deviceName: string;
}

const payload: SubscribePayload = {
  subscription: (await subscription).toJSON(),
  deviceName: 'My Device'
};

const response = await fetch('${API_BASE}/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});`,
          }}
        />

        {/* GET /api/subscribe */}
        <EndpointCard
          method="GET"
          path="/api/subscribe"
          title="List All Subscriptions"
          description="Get all registered device subscriptions. Requires API key authentication."
          auth={{
            description: 'Include your API key in the Authorization header',
            example: `Authorization: Bearer sk_yourkeyhere...`,
          }}
          response={JSON.stringify(
            {
              subscriptions: [
                {
                  id: 'sub_a1b2c3d4e5f6g7h8',
                  deviceName: 'My iPhone',
                  subscribedAt: '2024-05-28T10:30:00Z',
                  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
                },
                {
                  id: 'sub_x9y8z7w6v5u4t3s2',
                  deviceName: 'My Laptop',
                  subscribedAt: '2024-05-27T15:45:00Z',
                  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
                },
              ],
            },
            null,
            2
          )}
          examples={{
            curl: `curl ${API_BASE}/api/subscribe \\
  -H "Authorization: Bearer sk_yourkey..."`,
            js: `fetch('${API_BASE}/api/subscribe', {
  headers: {
    'Authorization': 'Bearer sk_yourkey...'
  }
})
  .then(res => res.json())
  .then(data => console.log(data.subscriptions))`,
            ts: `const response = await fetch('${API_BASE}/api/subscribe', {
  headers: {
    Authorization: 'Bearer sk_yourkey...'
  }
});
const { subscriptions } = await response.json();
console.log('Subscriptions:', subscriptions);`,
          }}
        />

        {/* POST /api/send */}
        <EndpointCard
          method="POST"
          path="/api/send"
          title="Send Push Notification"
          description="Send a push notification to one or more subscribed devices. Requires API key authentication."
          auth={{
            description: 'Include your API key in the Authorization header',
            example: `Authorization: Bearer sk_yourkeyhere...`,
          }}
          requestBody={JSON.stringify(
            {
              subscriptionId: 'sub_a1b2c3d4e5f6g7h8',
              notification: {
                title: 'Order Update',
                body: 'Your order #12345 has shipped!',
                icon: '/icon.png',
                image: '/order-shipped.png',
                badge: '/badge.png',
                tag: 'order-update',
                requireInteraction: false,
                actions: [
                  {
                    id: 'view',
                    title: 'View Order',
                    icon: '/view-icon.png',
                  },
                  {
                    id: 'track',
                    title: 'Track Package',
                  },
                ],
                data: {
                  orderId: '12345',
                  url: 'https://yoursite.com/orders/12345',
                  actionUrls: {
                    view: 'https://yoursite.com/orders/12345',
                    track: 'https://track.courier.com/12345',
                  },
                },
              },
            },
            null,
            2
          )}
          response={JSON.stringify(
            {
              success: true,
              message: 'Sent 1 notification(s)',
              result: {
                successful: 1,
                failed: 0,
                errors: [],
              },
            },
            null,
            2
          )}
          examples={{
            curl: `curl -X POST ${API_BASE}/api/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_yourkey..." \\
  -d '{
    "subscriptionId": "sub_abc123",
    "notification": {
      "title": "Hello!",
      "body": "You have a new message",
      "icon": "/icon.png"
    }
  }'`,
            js: `const response = await fetch('${API_BASE}/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk_yourkey...'
  },
  body: JSON.stringify({
    subscriptionId: 'sub_abc123',
    notification: {
      title: 'Hello!',
      body: 'You have a new message',
      icon: '/icon.png'
    }
  })
});
const data = await response.json();
console.log('Sent:', data.result.successful);`,
            ts: `interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actions?: Array<{ id: string; title: string }>;
  data?: Record<string, any>;
}

const response = await fetch('${API_BASE}/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk_yourkey...'
  },
  body: JSON.stringify({
    subscriptionId: 'sub_abc123',
    notification: {
      title: 'Hello!',
      body: 'Message content'
    } as NotificationPayload
  })
});`,
          }}
        />

        {/* DELETE /api/unsubscribe */}
        <EndpointCard
          method="DELETE"
          path="/api/unsubscribe"
          title="Unsubscribe Device"
          description="Remove a device from receiving push notifications."
          examples={{
            curl: `curl -X DELETE "${API_BASE}/api/unsubscribe?id=sub_abc123"`,
            js: `fetch('${API_BASE}/api/unsubscribe?id=sub_abc123', {
  method: 'DELETE'
})
  .then(res => res.json())
  .then(data => console.log(data.message))`,
            ts: `const subscriptionId = 'sub_abc123';
const response = await fetch(
  \`${API_BASE}/api/unsubscribe?id=\${subscriptionId}\`,
  { method: 'DELETE' }
);
const data = await response.json();`,
          }}
          response={JSON.stringify(
            {
              success: true,
              message: 'Device unsubscribed successfully',
            },
            null,
            2
          )}
        />

        {/* Error Handling */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
            <CardDescription>
              Common error responses and how to handle them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">401 Unauthorized</h4>
              <CodeBlock
                code={JSON.stringify(
                  {
                    error: 'Unauthorized: Invalid or missing API key',
                  },
                  null,
                  2
                )}
                id="error-401"
                language="json"
              />
              <p className="text-sm text-slate-600 mt-2">
                Your API key is missing or invalid. Check your Authorization header.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">400 Bad Request</h4>
              <CodeBlock
                code={JSON.stringify(
                  {
                    error: 'Invalid notification: must include title and body',
                  },
                  null,
                  2
                )}
                id="error-400"
                language="json"
              />
              <p className="text-sm text-slate-600 mt-2">
                Your request body is missing required fields.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">404 Not Found</h4>
              <CodeBlock
                code={JSON.stringify(
                  {
                    error: 'No valid subscriptions found for provided IDs',
                  },
                  null,
                  2
                )}
                id="error-404"
                language="json"
              />
              <p className="text-sm text-slate-600 mt-2">
                The subscription ID does not exist or is invalid.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">API Key Security</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Never expose your API key in client-side code</li>
                <li>Store API keys in environment variables</li>
                <li>Rotate keys regularly for better security</li>
                <li>Use different keys for different environments (dev, staging, prod)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Notification Content</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Keep titles short and descriptive (under 65 characters)</li>
                <li>Use clear, action-oriented body text</li>
                <li>Include images for better engagement</li>
                <li>Add custom buttons (actions) for quick interactions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Rate Limiting</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Implement your own rate limiting on the backend</li>
                <li>Avoid sending too many notifications to the same user</li>
                <li>Consider batch sending for multiple users</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
