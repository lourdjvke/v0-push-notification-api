# Direct Subscription Guide

## The Problem We Solved

Previously, we tried to embed a script that would register a service worker from a different origin. This fails due to browser security policies - **service workers can only be registered from the same origin**.

**Error:** `"The origin of the provided scriptURL does not match the current origin"`

## The Solution: Direct Subscription Links

We now provide a simple, direct URL that users can visit (or you can redirect them to) that:
1. Serves a beautiful subscription UI
2. Requests notification permission (native to the browser/OS)
3. Registers the service worker on our domain
4. Subscribes the user
5. Returns the subscription ID

## Getting Started

### Step 1: Get Your API Key

From the dashboard at `/dashboard`, copy your API key (format: `sk_xxxxxxxxxxxxx`)

### Step 2: Create a Subscription Link

Use this URL pattern:
```
https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your actual key.

### Step 3: Direct Users to Subscribe

You can:

**Option A: Add a link to your website**
```html
<a href="https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=sk_xxxxx" 
   target="_blank" 
   class="btn btn-primary">
  Enable Notifications
</a>
```

**Option B: Redirect with JavaScript**
```javascript
window.location.href = 'https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=sk_xxxxx';
```

**Option C: Popup/Modal**
```html
<button onclick="openSubscriptionPopup()">Enable Notifications</button>

<script>
function openSubscriptionPopup() {
  window.open(
    'https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=sk_xxxxx',
    'subscribe',
    'width=600,height=700'
  );
}
</script>
```

## How It Works (User Flow)

1. User clicks your link → Opens subscription page
2. Subscription page checks browser support
3. User sees: "Enable Notifications" button
4. User clicks button → Browser shows permission prompt
5. If granted:
   - Service worker is registered
   - Push subscription is created
   - Subscription is saved to our database
   - User sees success page with subscription ID
6. User can close the page

## Getting the Subscription ID

When a user successfully subscribes, they'll see their subscription ID on the success page. 

You can also retrieve all subscriptions for your API key via the analytics dashboard or API:

```bash
curl -X GET "https://v0-push-notification-api-nu.vercel.app/api/subscribe?apikey=sk_xxxxx" \
  -H "Authorization: Bearer sk_xxxxx"
```

## Sending Notifications

Once you have subscription IDs, send notifications anytime:

### From the Dashboard
Visit `/dashboard/send` and:
1. Enter subscription ID(s)
2. Enter notification title and body
3. Click "Send"

### Via API (curl)
```bash
curl -X POST "https://v0-push-notification-api-nu.vercel.app/api/send?apikey=sk_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxxxx",
    "notification": {
      "title": "Hello!",
      "body": "This is a test notification",
      "icon": "https://example.com/icon.png"
    }
  }'
```

### Via API (JavaScript)
```javascript
await fetch('https://v0-push-notification-api-nu.vercel.app/api/send?apikey=sk_xxxxx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionId: 'sub_xxxxx',
    notification: {
      title: 'Hello!',
      body: 'This is a test notification'
    }
  })
});
```

### Send to Multiple Users
```bash
curl -X POST "https://v0-push-notification-api-nu.vercel.app/api/send?apikey=sk_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionIds": ["sub_1", "sub_2", "sub_3"],
    "notification": {
      "title": "Announcement",
      "body": "This goes to multiple users"
    }
  }'
```

## Notification Options

All notification options are supported:

```javascript
{
  "title": "Required - Main heading",
  "body": "Required - Main message",
  "icon": "Optional - Icon URL",
  "image": "Optional - Large image URL",
  "badge": "Optional - Badge image URL",
  "tag": "Optional - Group notifications with same tag",
  "data": { /* Optional - Custom data */ },
  "actions": [
    { "action": "open", "title": "Open" },
    { "action": "close", "title": "Close" }
  ],
  "vibrate": [100, 50, 100],
  "silent": false,
  "requireInteraction": false
}
```

## Analytics

Visit `/dashboard/analytics` to see:
- Total subscriptions per API key
- Subscription breakdown by device/browser
- Engagement metrics (opens, clicks)
- Subscription timeline

## API Reference

### GET /api/subscribe?apikey=KEY
Serves the subscription UI page

### POST /api/subscribe?apikey=KEY
Save a subscription (called automatically by the UI)

### GET /api/subscribe (with auth header)
List all subscriptions for your API key

### POST /api/send?apikey=KEY
Send notifications to subscriptions

### GET /api/connection?apikey=KEY
Test CORS connectivity

### GET /api/analytics?subscriptionId=ID
Get analytics for a subscription

## Troubleshooting

**Q: User sees "Permission Denied" error**
A: User declined the browser permission prompt. They can enable it in browser settings.

**Q: No console errors but nothing happens**
A: Check that:
- API key is correct
- You're on HTTPS (required for notifications)
- Your browser supports notifications (modern Chrome, Firefox, Edge, Safari)

**Q: "Your browser does not support notifications"**
A: This browser doesn't support the Web Push API. Works in:
- Chrome/Chromium 50+
- Firefox 44+
- Edge 79+
- Safari 16+

## Best Practices

1. **Show a value proposition** before sending users to subscribe
   - "Get exclusive updates"
   - "Never miss important news"
   - "Stay in the loop"

2. **Ask at the right time** - Don't ask immediately on page load
   - After user performs an action
   - In a modal after they've spent time on your site
   - In settings/preferences

3. **Respect user choice** - Don't nag if they decline
   - Remember their choice
   - Don't ask again for 30+ days

4. **Send valuable notifications**
   - Don't spam with low-value content
   - Keep messages short and actionable
   - Use rich media (images, badges)

## Need Help?

Check the Integration Guide at `/dashboard/integration` in your dashboard for more examples and code snippets.
