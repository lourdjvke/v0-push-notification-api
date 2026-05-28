import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">API Documentation</h1>
          <p className="text-slate-600">Complete guide to using the Push Notification API</p>
        </div>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This Push Notification API allows you to send Web Push notifications to subscribed devices using VAPID (Voluntary Application Server Identification).
            </p>
            <p>
              The API is built on Next.js with Firebase Realtime Database for subscription storage and Web Push for notification delivery.
            </p>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>How to authenticate API requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Send and Delete (bulk) endpoints require API key authentication. Include your API key in the Authorization header:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded font-mono text-sm overflow-x-auto">
              {`Authorization: Bearer YOUR_API_KEY`}
            </div>
            <p className="text-sm text-slate-600">
              Replace <code className="bg-slate-100 px-2 py-1 rounded">YOUR_API_KEY</code> with your actual API key.
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscribe Endpoint */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">1. Subscribe to Notifications</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Endpoint:</p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                    POST /api/subscribe
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Description:</p>
                  <p>Register a new device subscription for push notifications (no API key required).</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Request Body:</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "auth": "...",
      "p256dh": "..."
    }
  },
  "deviceName": "My Device"
}`}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Response (201 Created):</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "message": "Successfully subscribed to push notifications",
  "subscriptionId": "sub_1234567890_abc123",
  "subscription": { ... }
}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Get Subscriptions Endpoint */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">2. Get All Subscriptions</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Endpoint:</p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                    GET /api/subscribe
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Authentication:</p>
                  <p>Requires API key in Authorization header</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Response (200 OK):</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "message": "Subscriptions retrieved successfully",
  "subscriptions": [
    {
      "id": "sub_1234567890_abc123",
      "endpoint": "https://...",
      "deviceName": "My Device",
      "subscribedAt": "2024-01-15T10:30:00Z",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "count": 1
}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Send Notification Endpoint */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">3. Send Notifications</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Endpoint:</p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                    POST /api/send
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Authentication:</p>
                  <p>Requires API key in Authorization header</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Request Body:</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "subscriptionId": "sub_1234567890_abc123",
  "notification": {
    "title": "Hello",
    "body": "This is a notification",
    "icon": "https://example.com/icon.png",
    "badge": "https://example.com/badge.png",
    "data": {
      "customField": "customValue"
    }
  }
}`}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Alternative - Send to Multiple Subscriptions:</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "subscriptionIds": [
    "sub_1234567890_abc123",
    "sub_9876543210_xyz789"
  ],
  "notification": {
    "title": "Hello",
    "body": "Broadcast message"
  }
}`}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Response (200 OK):</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "message": "Sent 1 notification(s)",
  "result": {
    "successful": 1,
    "failed": 0,
    "errors": []
  }
}`}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Notification Fields:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><code className="bg-slate-100 px-2 py-1 rounded">title</code> (required): Notification title</li>
                    <li><code className="bg-slate-100 px-2 py-1 rounded">body</code> (required): Notification body/message</li>
                    <li><code className="bg-slate-100 px-2 py-1 rounded">icon</code> (optional): URL to icon image</li>
                    <li><code className="bg-slate-100 px-2 py-1 rounded">badge</code> (optional): URL to badge image</li>
                    <li><code className="bg-slate-100 px-2 py-1 rounded">data</code> (optional): Custom data object</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Unsubscribe Endpoint */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">4. Unsubscribe Device</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Endpoint:</p>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                    DELETE /api/unsubscribe?id=subscriptionId
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Description:</p>
                  <p>Unsubscribe a specific device (no API key required).</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Query Parameters:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><code className="bg-slate-100 px-2 py-1 rounded">id</code> (required): The subscription ID</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-700 mb-2">Response (200 OK):</p>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "message": "Successfully unsubscribed",
  "subscriptionId": "sub_1234567890_abc123"
}`}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* cURL Examples */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Using cURL</h3>
              
              <p className="text-sm text-slate-600 mb-2">Subscribe device:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-xs mb-4">
{`curl -X POST https://yourapi.com/api/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{
    "subscription": {
      "endpoint": "https://...",
      "keys": {"auth": "...", "p256dh": "..."}
    },
    "deviceName": "My Phone"
  }'`}
              </div>

              <p className="text-sm text-slate-600 mb-2">Send notification:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-xs">
{`curl -X POST https://yourapi.com/api/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "subscriptionId": "sub_1234567890_abc123",
    "notification": {
      "title": "Hello!",
      "body": "This is a test notification"
    }
  }'`}
              </div>
            </div>

            {/* JavaScript Examples */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Using JavaScript</h3>
              
              <p className="text-sm text-slate-600 mb-2">Send notification:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-xs">
{`const response = await fetch('/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    subscriptionId: 'sub_1234567890_abc123',
    notification: {
      title: 'Hello!',
      body: 'This is a test notification',
      icon: '/icon.png'
    }
  })
});

const result = await response.json();
console.log(result);`}
              </div>
            </div>

            {/* Python Examples */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Using Python</h3>
              
              <p className="text-sm text-slate-600 mb-2">Send notification:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-xs">
{`import requests
import json

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
}

data = {
    'subscriptionId': 'sub_1234567890_abc123',
    'notification': {
        'title': 'Hello!',
        'body': 'This is a test notification'
    }
}

response = requests.post(
    'https://yourapi.com/api/send',
    headers=headers,
    json=data
)

print(response.json())`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Error Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-700 mb-2">401 Unauthorized:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "error": "Unauthorized: Invalid or missing API key"
}`}
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-2">400 Bad Request:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "error": "Invalid notification: must include title and body"
}`}
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-2">404 Not Found:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "error": "No valid subscriptions found for provided IDs"
}`}
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-2">500 Server Error:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 overflow-x-auto font-mono text-sm">
{`{
  "error": "Failed to send notification: <error message>"
}`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-700 mb-2">Environment Variables:</p>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 font-mono text-sm">
                <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
                <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
                <p>NEXT_PUBLIC_FIREBASE_DATABASE_URL</p>
                <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
                <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</p>
                <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</p>
                <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
                <p>NEXT_PUBLIC_VAPID_PUBLIC_KEY</p>
                <p>VAPID_PRIVATE_KEY (server-only)</p>
                <p>VAPID_SUBJECT (server-only)</p>
                <p>PUSH_API_KEYS (server-only, comma-separated)</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-2">Default API Key:</p>
              <p className="text-sm">
                If no API keys are configured, the default <code className="bg-slate-100 px-2 py-1 rounded">test-api-key-12345</code> is used.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
