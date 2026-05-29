# Push Notification API - Integration Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Setup](#setup)
3. [Dashboard](#dashboard)
4. [API Endpoints](#api-endpoints)
5. [CORS Support](#cors-support)
6. [Integration Methods](#integration-methods)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Get Your API Key
1. Visit the dashboard at `/dashboard`
2. Enter your email address
3. Create a new API key
4. Copy the key (shown only once!)

### 2. Embed in Your Website
Add one line to your HTML:
```html
<script src="https://yourdomain.com/api/init.js?apikey=sk_your_api_key"></script>
```

That's it! The script will:
- Request notification permission
- Subscribe the user's device
- Store the subscription ID locally
- Emit a `pushNotificationReady` event

### 3. Send Notifications
Use the dashboard at `/dashboard/send` or make API calls:
```bash
curl -X POST "https://yourdomain.com/api/send?apikey=sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "notification": {
      "title": "Hello",
      "body": "World"
    }
  }'
```

---

## Setup

### Environment Variables
No special environment variables needed - the API works with the existing Firebase configuration.

### Browser Requirements
- Modern browser with Service Worker support
- Notification API support
- Push API support
- Most modern browsers (Chrome 50+, Firefox 44+, Edge, Safari 16+)

---

## Dashboard

Access the full dashboard at `/dashboard` with these sections:

### API Keys (`/dashboard`)
- Create new API keys
- View your existing keys
- Delete API keys
- See integration examples

### Analytics (`/dashboard/analytics`)
- Track notification performance
- View engagement metrics
- See recent events
- Monitor subscription activity

### Send Notifications (`/dashboard/send`)
- Compose and send notifications
- Test with single or multiple subscriptions
- Preview notification appearance
- View send results

### Settings (`/dashboard/settings`)
- API documentation
- Best practices
- Authentication methods
- Support resources

---

## API Endpoints

### POST /api/subscribe
Subscribe a device to push notifications.

**Parameters (body):**
- `subscription` (required): PushSubscriptionJSON object
- `deviceName` (optional): Human-readable device name
- `apikey` (optional): API key to link subscription to user account

**Response:**
```json
{
  "subscriptionId": "sub_123...",
  "message": "Successfully subscribed to push notifications"
}
```

**Example:**
```javascript
fetch('https://yourdomain.com/api/subscribe?apikey=sk_xxx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceName: 'My Device',
    apikey: 'sk_xxx'
  })
})
```

---

### POST /api/send
Send push notifications to subscriptions.

**Required:** API Key (in header or query param)

**Parameters (body):**
- `subscriptionId` (string, optional): Single subscription
- `subscriptionIds` (array, optional): Multiple subscriptions
- `notification` (object, required): Notification payload

**Notification Object:**
- `title` (string, required): Notification title
- `body` (string, required): Notification body
- `icon` (string, optional): Icon URL
- `image` (string, optional): Image URL
- `badge` (string, optional): Badge icon URL
- `requireInteraction` (boolean, optional): Don't auto-dismiss
- `data` (object, optional): Custom data

**Response:**
```json
{
  "result": {
    "successful": 1,
    "failed": 0,
    "errors": []
  }
}
```

**Example:**
```javascript
fetch('https://yourdomain.com/api/send?apikey=sk_xxx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_1', 'sub_2'],
    notification: {
      title: 'Update Available',
      body: 'Please refresh your browser',
      icon: 'https://yourdomain.com/icon.png'
    }
  })
})
```

---

### DELETE /api/unsubscribe
Unsubscribe a device.

**Parameters (query):**
- `id` (required): Subscription ID

**Example:**
```javascript
fetch('https://yourdomain.com/api/unsubscribe?id=sub_xxx', {
  method: 'DELETE'
})
```

---

### GET /api/analytics
Get analytics for a subscription.

**Parameters (query):**
- `subscriptionId` (required): Subscription ID

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "stats": {
    "notificationsReceived": 10,
    "notificationsOpened": 7,
    "notificationsClicked": 3
  },
  "engagementRate": "70.00",
  "recentEvents": [...]
}
```

---

### GET /api/connection
Test CORS connectivity and API key validity.

**Parameters (query):**
- `apikey` (required): API key to test

**Response:**
```json
{
  "status": "ok",
  "message": "CORS not blocking",
  "apiKeyValid": true,
  "timestamp": "2024-05-29T12:00:00Z"
}
```

**Use this to verify CORS works from your website:**
```javascript
fetch('https://yourdomain.com/api/connection?apikey=sk_xxx')
  .then(r => r.json())
  .then(data => console.log(data))
```

---

### GET /api/vapid
Get VAPID public key for subscription.

**Response:**
```json
{
  "publicKey": "BGLb..."
}
```

---

## CORS Support

All endpoints support CORS with:
- Allow any origin (`*`)
- GET, POST, PUT, DELETE, OPTIONS
- Content-Type and Authorization headers
- 24-hour preflight cache

### Testing CORS
1. Use the `/api/connection` endpoint
2. Test from your website domain
3. Check browser DevTools Network tab for CORS headers

### Common CORS Issues

**Problem:** `OPTIONS request returns 405`
- Solution: All endpoints support OPTIONS for preflight

**Problem:** CORS headers missing in response
- Solution: Make sure you're using the init.js script or proper fetch options

**Problem:** API key not recognized
- Solution: Use the exact key from dashboard, or test with `/api/connection`

---

## Integration Methods

### Method 1: Auto-Init Script (Easiest)
```html
<script src="https://yourdomain.com/api/init.js?apikey=sk_xxx"></script>
```

Pros: Simple, automatic permission handling
Cons: Limited customization

---

### Method 2: Manual Integration
```javascript
// Request permission
const permission = await Notification.requestPermission();

// Register service worker
const reg = await navigator.serviceWorker.register('/sw.js');

// Get VAPID key
const vapid = await fetch('/api/vapid').then(r => r.json());

// Subscribe
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapid.publicKey)
});

// Send to server
fetch('/api/subscribe?apikey=sk_xxx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: sub.toJSON(),
    apikey: 'sk_xxx'
  })
})
```

Pros: Full control, custom UX
Cons: More code required

---

### Method 3: React Component
```jsx
import { useEffect, useState } from 'react';

export function NotificationButton() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Initialize with auto-script
    window.addEventListener('pushNotificationReady', () => {
      setSubscribed(true);
    });
  }, []);

  return (
    <button>
      {subscribed ? 'Notifications Enabled' : 'Enable Notifications'}
    </button>
  );
}
```

---

## Examples

See `public/api-examples.js` for complete working examples:
- Simple subscription
- Sending notifications
- Multiple subscriptions
- Analytics tracking
- Error handling
- React integration
- Complete notification manager class

---

## Troubleshooting

### CORS Not Blocking (Verified)
If you see `CORS not blocking` from the `/api/connection` endpoint, the API is fully accessible from your website.

### API Key Issues
1. Check you copied the full key (starts with `sk_`)
2. Verify it hasn't expired in the dashboard
3. Test with `/api/connection?apikey=YOUR_KEY`

### Notifications Not Showing
1. Verify user granted permission
2. Check browser notification settings
3. Verify subscription ID is correct
4. Check browser console for errors

### Permission Denied
1. User blocked notifications for your domain
2. User can re-enable in browser settings
3. Use `/dashboard/send` to test with your device

### Service Worker Issues
1. Verify `/sw.js` exists and is accessible
2. Check browser DevTools Application > Service Workers
3. Ensure site is HTTPS (localhost is OK for testing)

### Database Issues
The system uses Firebase Realtime Database:
1. Subscriptions are stored in `subscriptions/` path
2. User keys stored in `api_keys/` path  
3. Analytics stored in `analytics/` path

Check Firebase console if subscriptions aren't saving.

---

## Best Practices

1. **Security**
   - Never hardcode API keys in production code
   - Use environment variables for server-side calls
   - Use query params only for testing
   - Rotate keys regularly

2. **Performance**
   - Batch notifications when sending to multiple devices
   - Use analytics to optimize notification frequency
   - Test with real devices before production

3. **UX**
   - Request permission at the right time
   - Show what user will get notifications about
   - Provide easy unsubscribe option
   - Respect user preferences

4. **Testing**
   - Test CORS with `/api/connection`
   - Test from multiple domains
   - Test from different browsers
   - Use `/dashboard/send` for manual testing

---

## Support

- Check `/dashboard/settings` for documentation
- Review `/demo` for working examples
- See `/api-reference` for full API reference
- Check browser DevTools for network/console errors

