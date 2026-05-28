'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/CodeBlock';

const BASE_URL = 'https://v0-push-notification-api.vercel.app';
const API_KEY = 'test-api-key-12345';

export default function SetupPage() {
  const [activeStep, setActiveStep] = useState('step1');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Integration Setup</h1>
              <p className="text-sm text-slate-600">8-Step Complete Guide</p>
            </div>
            <nav className="flex gap-2">
              <a href="/" className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded">
                Dashboard
              </a>
              <a href="/api-reference" className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded">
                API Docs
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(`step${step}`)}
                className={`px-4 py-2 rounded font-medium whitespace-nowrap ${
                  activeStep === `step${step}`
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1 */}
        {activeStep === 'step1' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Set Base URL and API Key</CardTitle>
              <CardDescription>Configure your environment variables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-slate-600">
                  These values will be used in all your API requests. The test API key works immediately without setup.
                </p>
                <CodeBlock
                  code={`// Configuration for your application
const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';

console.log('Base URL:', BASE_URL);
console.log('API Key:', API_KEY);
console.log('✓ You are ready to proceed to Step 2');`}
                  language="javascript"
                  title="Configuration Setup"
                  description="Copy this to your project and verify in browser console"
                />
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-semibold text-green-900">Expected Console Output:</p>
                  <p className="text-xs text-green-800 font-mono mt-2">Base URL: https://v0-push-notification-api.vercel.app</p>
                  <p className="text-xs text-green-800 font-mono">API Key: test-api-key-12345</p>
                  <p className="text-xs text-green-800 font-mono">✓ You are ready to proceed to Step 2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 */}
        {activeStep === 'step2' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Subscribe User and Get Subscription ID</CardTitle>
              <CardDescription>Register device for push notifications and save subscription ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-slate-600">
                  This code requests notification permission, registers with our service, and returns a unique subscription ID. This ID is required to send notifications to this user.
                </p>
                <CodeBlock
                  code={`const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';
const VAPID_KEY = 'BGLbLfrYWC5npSRnE1QrNXZQrvnlkLommK6OvZUeUNrNKpFbKTFQkLvT0_19CiYeXsHGMs7DdAGPErC25BLTaPA';

async function subscribeUser() {
  try {
    // Step 1: Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return;
    }
    console.log('✓ Notification permission granted');

    // Step 2: Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✓ Service worker registered');

    // Step 3: Get push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY
    });
    console.log('✓ Push subscription created');

    // Step 4: Send subscription to backend and get ID
    const response = await fetch(BASE_URL + '/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceName: 'My Device'
      })
    });

    const data = await response.json();
    
    console.log('\\n✓ Device registered successfully!');
    console.log('Subscription ID:', data.subscriptionId);
    console.log('Save this ID - you need it to send notifications');
    
    return data.subscriptionId;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run it in browser console
subscribeUser();`}
                  language="javascript"
                  title="Subscribe User Code"
                  description="Run this in browser console (F12 > Console tab)"
                />
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-semibold text-green-900">Expected Console Output:</p>
                  <pre className="text-xs text-green-800 font-mono mt-2 whitespace-pre-wrap break-words">
{`✓ Notification permission granted
✓ Service worker registered
✓ Push subscription created

✓ Device registered successfully!
Subscription ID: sub_1a2b3c4d5e6f7g8h9i0j
Save this ID - you need it to send notifications`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 */}
        {activeStep === 'step3' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Understand Subscription Linking</CardTitle>
              <CardDescription>How your backend sends notifications without needing a custom service worker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>How it works:</strong> When a user subscribes, we save their subscription endpoint and link it to a unique subscription ID. Your backend uses this ID to send notifications through our service. The browser's service worker receives and displays them automatically. No custom service worker code needed!
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">The Flow:</h4>
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <p className="font-medium text-slate-900">User Subscribes</p>
                        <p className="text-sm text-slate-600">User clicks "Allow" for notifications in browser</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <p className="font-medium text-slate-900">Get Subscription ID</p>
                        <p className="text-sm text-slate-600">Your app sends subscription to our API, receives unique ID</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <p className="font-medium text-slate-900">Send Notification</p>
                        <p className="text-sm text-slate-600">Your backend sends payload to /api/send with subscription ID and API key</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <p className="font-medium text-slate-900">Notification Delivered</p>
                        <p className="text-sm text-slate-600">Our backend sends it through Push API, browser receives it</p>
                      </div>
                    </div>
                  </div>
                </div>

                <CodeBlock
                  code={`// Your backend (Node.js example)
const subscription_id = 'sub_1a2b3c4d5e6f7g8h9i0j'; // From Step 2
const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';

async function sendNotificationFromBackend() {
  const response = await fetch(BASE_URL + '/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    },
    body: JSON.stringify({
      subscriptionId: subscription_id,
      notification: {
        title: 'Order Shipped',
        body: 'Your order is on the way!'
      }
    })
  });

  const result = await response.json();
  console.log('Notification sent:', result);
}

// Call from your backend whenever you need to notify user
// No custom service worker needed - ours handles it!`}
                  language="javascript"
                  title="Backend Notification Code"
                  description="Your server sends notification using subscription ID"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4 */}
        {activeStep === 'step4' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Send Simple Notification</CardTitle>
              <CardDescription>Send your first notification with just title and body</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CodeBlock
                code={`const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';
const SUBSCRIPTION_ID = 'sub_1a2b3c4d5e6f7g8h9i0j'; // Replace with your subscription ID from Step 2

async function sendSimpleNotification() {
  const response = await fetch(BASE_URL + '/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    },
    body: JSON.stringify({
      subscriptionId: SUBSCRIPTION_ID,
      notification: {
        title: 'Hello World',
        body: 'This is your first notification!'
      }
    })
  });

  const result = await response.json();
  console.log('Response:', result);
}

// Run it in console
sendSimpleNotification();`}
                language="javascript"
                title="Send Simple Notification"
                description="Run this in browser console"
              />
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-900">Expected Response:</p>
                <pre className="text-xs text-green-800 font-mono mt-2 whitespace-pre-wrap break-words">
{`{
  "success": true,
  "message": "Sent 1 notification(s)",
  "result": {
    "successful": 1,
    "failed": 0
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5 */}
        {activeStep === 'step5' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Send Notification with Action Buttons</CardTitle>
              <CardDescription>Add interactive buttons to your notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                Users can click buttons without opening your app. Perfect for confirmations, quick actions, etc.
              </p>
              <CodeBlock
                code={`const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';
const SUBSCRIPTION_ID = 'sub_1a2b3c4d5e6f7g8h9i0j'; // Replace with your subscription ID

async function sendNotificationWithButtons() {
  const response = await fetch(BASE_URL + '/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    },
    body: JSON.stringify({
      subscriptionId: SUBSCRIPTION_ID,
      notification: {
        title: 'Order Shipped!',
        body: 'Your order #12345 is on the way',
        actions: [
          {
            id: 'view-order',
            title: 'View Order'
          },
          {
            id: 'track-package',
            title: 'Track Package'
          }
        ],
        data: {
          orderId: '12345',
          actionUrls: {
            'view-order': 'https://example.com/orders/12345',
            'track-package': 'https://tracker.example.com/12345'
          }
        }
      }
    })
  });

  const result = await response.json();
  console.log('Notification with buttons sent:', result);
}

// Run it
sendNotificationWithButtons();`}
                language="javascript"
                title="Send Notification with Buttons"
                description="User sees two clickable buttons on the notification"
              />
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <p className="text-sm font-semibold text-purple-900">What user sees:</p>
                <div className="mt-3 p-3 bg-white border rounded">
                  <p className="font-semibold text-sm">Order Shipped!</p>
                  <p className="text-sm text-slate-600">Your order #12345 is on the way</p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">View Order</button>
                    <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Track Package</button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6 */}
        {activeStep === 'step6' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 6: Send Notification with Buttons and Image</CardTitle>
              <CardDescription>Add images for visual impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                Combine images with buttons for rich, engaging notifications.
              </p>
              <CodeBlock
                code={`const BASE_URL = '${BASE_URL}';
const API_KEY = '${API_KEY}';
const SUBSCRIPTION_ID = 'sub_1a2b3c4d5e6f7g8h9i0j'; // Replace with your subscription ID

async function sendRichNotification() {
  const response = await fetch(BASE_URL + '/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    },
    body: JSON.stringify({
      subscriptionId: SUBSCRIPTION_ID,
      notification: {
        title: 'Payment Confirmed',
        body: 'Your payment of $99.99 has been processed',
        image: 'https://example.com/payment-receipt.jpg',
        icon: 'https://example.com/app-icon.png',
        badge: 'https://example.com/badge.png',
        actions: [
          {
            id: 'view-receipt',
            title: 'View Receipt'
          },
          {
            id: 'support',
            title: 'Get Help'
          }
        ],
        data: {
          transactionId: 'TXN_12345',
          actionUrls: {
            'view-receipt': 'https://example.com/receipt/TXN_12345',
            'support': 'https://example.com/support'
          }
        }
      }
    })
  });

  const result = await response.json();
  console.log('Rich notification sent:', result);
}

// Run it
sendRichNotification();`}
                language="javascript"
                title="Send Rich Notification"
                description="Notification with image, buttons, and custom data"
              />
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900">Configuration Details:</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li><strong>image:</strong> Large display image (recommended 2:1 ratio)</li>
                  <li><strong>icon:</strong> Small app icon shown in notification</li>
                  <li><strong>badge:</strong> Monochrome icon for some platforms</li>
                  <li><strong>actions:</strong> Up to 3 interactive buttons</li>
                  <li><strong>data:</strong> Custom data accessible when button is clicked</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7 */}
        {activeStep === 'step7' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 7: Core Endpoints Summary</CardTitle>
              <CardDescription>Quick reference for essential endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 rounded">
                  <p className="font-semibold text-slate-900 mb-2">Configuration (No API Key Required):</p>
                  <CodeBlock
                    code={`// Get VAPID Public Key
curl ${BASE_URL}/api/config`}
                    language="bash"
                    title="GET /api/config"
                  />
                </div>

                <div className="p-4 bg-slate-100 rounded">
                  <p className="font-semibold text-slate-900 mb-2">Subscribe User (No API Key Required):</p>
                  <CodeBlock
                    code={`// Register device and get subscription ID
curl -X POST ${BASE_URL}/api/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{
    "subscription": { ...pushSubscription.toJSON() },
    "deviceName": "My Device"
  }'
  
// Response includes: subscriptionId`}
                    language="bash"
                    title="POST /api/subscribe"
                  />
                </div>

                <div className="p-4 bg-slate-100 rounded">
                  <p className="font-semibold text-slate-900 mb-2">Send Notification (API Key Required):</p>
                  <CodeBlock
                    code={`// Send notification to user
curl -X POST ${BASE_URL}/api/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${API_KEY}" \\
  -d '{
    "subscriptionId": "sub_...",
    "notification": {
      "title": "Your Title",
      "body": "Your message",
      "icon": "url_to_icon",
      "image": "url_to_image",
      "actions": [
        { "id": "action1", "title": "Button 1" }
      ]
    }
  }'`}
                    language="bash"
                    title="POST /api/send"
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm font-semibold text-amber-900">Key Points:</p>
                  <ul className="text-sm text-amber-800 mt-2 space-y-1">
                    <li>• Base URL: <code className="bg-white px-2 py-1 rounded">{BASE_URL}</code></li>
                    <li>• Test API Key: <code className="bg-white px-2 py-1 rounded">{API_KEY}</code></li>
                    <li>• Subscription ID is obtained from POST /api/subscribe</li>
                    <li>• All sending operations require API Key authentication</li>
                    <li>• Each subscription ID can receive unlimited notifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 8 */}
        {activeStep === 'step8' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 8: Unsubscribe User</CardTitle>
              <CardDescription>Remove user from push notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-600">
                Allow users to disable notifications. This removes their subscription from your system.
              </p>
              <CodeBlock
                code={`const BASE_URL = '${BASE_URL}';
const SUBSCRIPTION_ID = 'sub_1a2b3c4d5e6f7g8h9i0j'; // Replace with your subscription ID

// Browser side - unsubscribe from push manager
async function unsubscribeUser() {
  try {
    // Step 1: Unsubscribe from browser
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✓ Unsubscribed from browser');
    }

    // Step 2: Notify backend to delete subscription record
    const response = await fetch(BASE_URL + '/api/unsubscribe?id=' + SUBSCRIPTION_ID, {
      method: 'DELETE'
    });

    const result = await response.json();
    console.log('✓ Unsubscribed from backend:', result);
    console.log('User will no longer receive notifications');
    
  } catch (error) {
    console.error('Error unsubscribing:', error);
  }
}

// Run it in console
unsubscribeUser();`}
                language="javascript"
                title="Unsubscribe User"
                description="Run this to remove user from notifications"
              />
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-900">Expected Output:</p>
                <pre className="text-xs text-green-800 font-mono mt-2 whitespace-pre-wrap break-words">
{`✓ Unsubscribed from browser
✓ Unsubscribed from backend: {
  "success": true,
  "message": "Subscription deleted successfully"
}
User will no longer receive notifications`}
                </pre>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900">Important:</p>
                <p className="text-sm text-blue-800 mt-2">
                  Always provide a way for users to unsubscribe. It's required by most app stores and is good user experience.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          {activeStep !== 'step1' && (
            <button
              onClick={() => {
                const currentStep = parseInt(activeStep.replace('step', ''));
                setActiveStep(`step${currentStep - 1}`);
              }}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded font-medium"
            >
              Previous
            </button>
          )}
          {activeStep !== 'step8' && (
            <button
              onClick={() => {
                const currentStep = parseInt(activeStep.replace('step', ''));
                setActiveStep(`step${currentStep + 1}`);
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
