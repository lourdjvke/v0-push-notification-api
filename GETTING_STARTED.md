# Getting Started with Push Notification API

Welcome! Your complete Web Push Notification API is ready to use. Follow this guide to get up and running.

## ✅ What You Have

A fully functional push notification system with:
- **REST API** with 5 endpoints
- **Firebase Realtime Database** integration
- **VAPID-secured** push notifications
- **Beautiful web interface** for managing devices
- **Complete API documentation**
- **Production-ready code**

## 🚀 Quick Start (2 minutes)

### 1. Start the Server
```bash
pnpm dev
```

### 2. Open the App
Visit `http://localhost:3000` in your browser

### 3. Subscribe Your Device
- Click the **"Subscribe"** button
- Your device will appear in the subscriptions list
- Copy your **Subscription ID**

### 4. Send a Test Notification
- Fill in a title and message
- Click **"Send Test Notification"**
- Your browser will receive the notification! 🎉

## 📖 Documentation

### For End Users
- **Quick Start**: See `QUICKSTART.md` for fast reference
- **Homepage**: `http://localhost:3000` - Interactive interface
- **Docs Page**: `http://localhost:3000/docs` - Full API reference

### For Developers
- **README.md** - Complete technical documentation
- **BUILD_SUMMARY.md** - Architecture and implementation details
- **This file** - Getting started guide

## 🔌 API Overview

Your API has 5 endpoints:

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/config` | Get VAPID public key | ❌ |
| `POST /api/subscribe` | Register a device | ❌ |
| `GET /api/subscribe` | List all devices | ✅ |
| `POST /api/send` | Send notifications | ✅ |
| `DELETE /api/unsubscribe` | Unsubscribe device | ❌ |

**✅ Auth Required**: Use `Authorization: Bearer test-api-key-12345`

## 💻 First API Call

### Using cURL

```bash
# Get the VAPID public key
curl http://localhost:3000/api/config

# List subscriptions (requires API key)
curl http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer test-api-key-12345"

# Send a notification
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "your_subscription_id_here",
    "notification": {
      "title": "Hello",
      "body": "This is your first API notification"
    }
  }'
```

### Using JavaScript

```javascript
// Send notification via API
const response = await fetch('/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-api-key-12345'
  },
  body: JSON.stringify({
    subscriptionId: 'your_subscription_id',
    notification: {
      title: 'Hello from API',
      body: 'Sent via JavaScript'
    }
  })
});

const result = await response.json();
console.log(result);
```

### Using Python

```python
import requests
import json

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-api-key-12345'
}

data = {
    'subscriptionId': 'your_subscription_id',
    'notification': {
        'title': 'Hello from Python',
        'body': 'Sent via Python requests'
    }
}

response = requests.post(
    'http://localhost:3000/api/send',
    headers=headers,
    json=data
)

print(response.json())
```

## 🎯 Common Use Cases

### 1. Send to Single Device
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "sub_abc123",
    "notification": {
      "title": "Order Shipped",
      "body": "Your order has been shipped!"
    }
  }'
```

### 2. Broadcast to All Devices
```bash
# First get all subscription IDs
curl http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer test-api-key-12345" \
  | jq '.subscriptions[].id'

# Then send to all
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionIds": ["sub_1", "sub_2", "sub_3"],
    "notification": {
      "title": "System Update",
      "body": "New features available"
    }
  }'
```

### 3. Send with Custom Data
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "sub_abc123",
    "notification": {
      "title": "New Message",
      "body": "You have a new message",
      "icon": "https://example.com/icon.png",
      "data": {
        "messageId": "msg_123",
        "userId": "user_456",
        "actionUrl": "https://example.com/messages/123"
      }
    }
  }'
```

## 🔐 API Key Security

### For Development
Default API key: `test-api-key-12345`

### For Production
Set multiple secure keys in `.env.local`:
```env
PUSH_API_KEYS=production-key-1,production-key-2,production-key-3
```

Then use any of these keys:
```bash
curl http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer production-key-1"
```

## 📋 Expected Responses

### Success (200)
```json
{
  "message": "Sent 1 notification(s)",
  "result": {
    "successful": 1,
    "failed": 0,
    "errors": []
  }
}
```

### Error - Invalid API Key (401)
```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

### Error - Invalid Data (400)
```json
{
  "error": "Invalid notification: must include title and body"
}
```

### Error - Not Found (404)
```json
{
  "error": "No valid subscriptions found for provided IDs"
}
```

## 🧪 Testing

### Manual Testing via Web UI
1. Visit `http://localhost:3000`
2. Click "Subscribe"
3. Send test notifications
4. See them appear in your browser

### Testing via API
See "First API Call" section above for cURL, JavaScript, and Python examples

### Testing Batch Notifications
```bash
# Subscribe multiple devices first (via the UI)
# Then test batch send with multiple subscription IDs
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionIds": [
      "sub_first_device",
      "sub_second_device",
      "sub_third_device"
    ],
    "notification": {
      "title": "Test Batch",
      "body": "Testing batch notifications"
    }
  }'
```

## 🚀 Deployment

### Deploy to Vercel
```bash
vercel deploy
```

Before deploying:
1. Set environment variables in Vercel dashboard
2. Set secure API keys
3. Configure Firebase security rules
4. Enable HTTPS

See `README.md` for complete production checklist.

## 📁 Project Files

**Key Files You Need to Know:**

```
app/
├── page.tsx              ← Your homepage (subscription UI)
├── docs/page.tsx         ← API documentation page
└── api/                  ← All API endpoints
    ├── config/route.ts
    ├── subscribe/route.ts
    ├── send/route.ts
    └── unsubscribe/route.ts

lib/
├── firebase.ts           ← Database setup
├── push-service.ts       ← Web Push logic
├── api-auth.ts           ← Authentication
└── push-client.ts        ← Client-side tools

public/
└── sw.js                 ← Service Worker
```

## ⚙️ Configuration

All configuration is in `.env.local`:

```env
# Your Firebase config (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

# Your VAPID keys (already set)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=...

# API keys (for production)
PUSH_API_KEYS=test-api-key-12345
```

## 🐛 Troubleshooting

### "Notifications not appearing?"
- Check that you **subscribed** first (click Subscribe button)
- Check browser **notification permissions**
- Verify **subscription ID** is correct
- Check browser **console** for errors

### "API returns 401?"
- Verify you **included the Authorization header**
- Check the **API key format**: `Bearer YOUR_KEY`
- Verify the **API key** is correct

### "Service Worker not registering?"
- Requires **HTTPS** (or localhost for dev)
- Check **browser console** for errors
- Verify **`/public/sw.js`** exists and is accessible

### "Can't subscribe?"
- Your browser must **support Web Push API**
- Try Chrome, Firefox, Edge, or Safari 16+
- Check you're not in **private/incognito mode**

## 📚 More Information

- **Quick Reference**: See `QUICKSTART.md`
- **Full Documentation**: See `README.md`
- **Technical Details**: See `BUILD_SUMMARY.md`
- **API Docs**: Visit `http://localhost:3000/docs`

## ✨ Features

✅ Multi-device support  
✅ VAPID encryption  
✅ Single & batch sends  
✅ Custom data payloads  
✅ API key authentication  
✅ Firebase storage  
✅ Beautiful web UI  
✅ Complete documentation  
✅ Production ready  

## 🎯 Next Steps

1. **Try the UI** - Click Subscribe and send a test notification
2. **Read the Docs** - Visit `/docs` page
3. **Test the API** - Try a cURL request
4. **Integrate** - Use the API in your application
5. **Deploy** - Push to production when ready

## 📞 Support

- **API Reference**: `/docs` page
- **Technical Guide**: `README.md`
- **Quick Reference**: `QUICKSTART.md`
- **Architecture**: `BUILD_SUMMARY.md`

---

**That's it! You're ready to send push notifications.** 🚀

Start with the web UI, then integrate the API into your application.
