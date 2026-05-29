'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function IntegrationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Integration Guide</h1>
        <p className="text-gray-600">Simple ways to integrate push notifications into your application</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Direct Subscription Link</h2>
        <p className="text-blue-800 mb-4">The simplest way - users click a link to subscribe</p>
        <div className="bg-white p-4 rounded border border-blue-200 space-y-3">
          <p className="text-sm text-gray-700">
            Navigate to this URL to request notification permission and subscribe:
          </p>
          <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
            https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY
          </div>
          <button
            onClick={() => copyCode('https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY')}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {copiedCode === 'https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-2">HTML Button</h2>
        <p className="text-purple-800 mb-4">Add a button to your website that opens the subscription page</p>
        <div className="bg-white p-4 rounded border border-purple-200">
          <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto mb-3">
            <div>{`<a href="https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY"`}</div>
            <div>{`   target="_blank"`}</div>
            <div>{`   className="btn btn-primary">`}</div>
            <div>{`  Enable Notifications`}</div>
            <div>{`</a>`}</div>
          </div>
          <button
            onClick={() => copyCode(
              `<a href="https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY" target="_blank" className="btn btn-primary">Enable Notifications</a>`
            )}
            className="text-sm px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {copiedCode?.includes('Enable Notifications') ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-2">Programmatic API Call (JavaScript)</h2>
        <p className="text-green-800 mb-4">Call the subscription endpoint from your application code</p>
        <div className="bg-white p-4 rounded border border-green-200">
          <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto mb-3">
            <div>{`const subscriptionUrl = 'https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY';`}</div>
            <div>{`window.location.href = subscriptionUrl;`}</div>
          </div>
          <button
            onClick={() => copyCode(
              `const subscriptionUrl = 'https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY';\nwindow.location.href = subscriptionUrl;`
            )}
            className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {copiedCode?.includes('const subscriptionUrl') ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-2">Send Notifications</h2>
        <p className="text-amber-800 mb-4">Once users are subscribed, send them notifications</p>
        <div className="bg-white p-4 rounded border border-amber-200 space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">Using curl:</p>
            <div className="bg-gray-900 text-white p-3 rounded font-mono text-xs overflow-x-auto">
              <div>{`curl -X POST "https://v0-push-notification-api-nu.vercel.app/api/send?apikey=YOUR_API_KEY" \\`}</div>
              <div>{`  -H "Content-Type: application/json" \\`}</div>
              <div>{`  -d '{`}</div>
              <div>{`    "subscriptionId": "sub_xxxxx",`}</div>
              <div>{`    "notification": {`}</div>
              <div>{`      "title": "Hello User!",`}</div>
              <div>{`      "body": "This is a test notification",`}</div>
              <div>{`      "icon": "https://example.com/icon.png"`}</div>
              <div>{`    }`}</div>
              <div>{`  }'`}</div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-700 mb-2">Using JavaScript:</p>
            <div className="bg-gray-900 text-white p-3 rounded font-mono text-xs overflow-x-auto">
              <div>{`await fetch('https://v0-push-notification-api-nu.vercel.app/api/send?apikey=YOUR_API_KEY', {`}</div>
              <div>{`  method: 'POST',`}</div>
              <div>{`  headers: { 'Content-Type': 'application/json' },`}</div>
              <div>{`  body: JSON.stringify({`}</div>
              <div>{`    subscriptionId: 'sub_xxxxx',`}</div>
              <div>{`    notification: {`}</div>
              <div>{`      title: 'Hello User!',`}</div>
              <div>{`      body: 'This is a test notification'`}</div>
              <div>{`    }`}</div>
              <div>{`  })`}</div>
              <div>{`});`}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">How It Works</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="font-bold text-gray-900">1.</span>
            <span>User visits the subscription link with your API key</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-gray-900">2.</span>
            <span>Browser shows a permission prompt (native to the OS)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-gray-900">3.</span>
            <span>If granted, the subscription is automatically saved to our database</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-gray-900">4.</span>
            <span>You receive a subscription ID to target this device</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-gray-900">5.</span>
            <span>Use the subscription ID to send notifications anytime</span>
          </li>
        </ol>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-indigo-900 mb-2">Key Points</h2>
        <ul className="space-y-2 text-indigo-800 text-sm">
          <li>✓ No code needed on your website - just a link</li>
          <li>✓ Works from any website (no cross-origin issues)</li>
          <li>✓ Automatic service worker registration on our domain</li>
          <li>✓ Users get a native browser permission prompt</li>
          <li>✓ All CORS issues handled automatically</li>
          <li>✓ Subscription IDs persist in our database for targeting</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard/analytics"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Analytics
        </Link>
      </div>
    </div>
  );
}
