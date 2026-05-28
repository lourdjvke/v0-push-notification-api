# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install & Run

```bash
# Dependencies already installed, just start the dev server
pnpm dev
```

The API is now running at `http://localhost:3000`

### 2. Visit the Homepage

Open your browser to `http://localhost:3000` and you'll see:

- **Device Subscription Form** - Click "Subscribe" to register your device
- **Subscription ID Display** - Copy this ID to use in API calls
- **Test Notification Sender** - Send test notifications directly from the UI
- **Subscriptions List** - See all registered devices in real-time

### 3. Send Your First Notification

**Via the Web UI:**
1. Click "Subscribe" on the homepage
2. Enter your notification title and body
3. Click "Send Test Notification"
4. Watch the notification appear! 🎉

**Via cURL:**
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "sub_YOUR_ID_HERE",
    "notification": {
      "title": "Hello!",
      "body": "Your first push notification"
    }
  }'
```

### 4. Read the API Docs

Visit `http://localhost:3000/docs` for:
- Complete API endpoint reference
- Request/response examples
- Authentication details
- Code examples in cURL, JavaScript, and Python

## 📋 API Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/config` | GET | ❌ | Get VAPID public key |
| `/api/subscribe` | POST | ❌ | Register device |
| `/api/subscribe` | GET | ✅ | List all devices |
| `/api/send` | POST | ✅ | Send notifications |
| `/api/unsubscribe` | DELETE | ❌ | Unsubscribe device |

**✅ = Requires API key: `Authorization: Bearer test-api-key-12345`**

## 📝 Sending Notifications

### Minimal Request
```json
{
  "subscriptionId": "sub_1234567890_abc123",
  "notification": {
    "title": "Required",
    "body": "Required message text"
  }
}
```

### Full Request with All Options
```json
{
  "subscriptionIds": [
    "sub_1234567890_abc123",
    "sub_9876543210_xyz789"
  ],
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "https://example.com/icon.png",
    "badge": "https://example.com/badge.png",
    "data": {
      "customKey": "customValue"
    }
  }
}
```

## 🔐 API Key

Default API key for testing: `test-api-key-12345`

For production, set multiple keys in `.env.local`:
```env
PUSH_API_KEYS=key1,key2,key3
```

## 🧪 Testing the Full Flow

### Step 1: Subscribe
```bash
# This is done in the web UI, but here's the technical flow:
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {...},
    "deviceName": "My Device"
  }'
# Returns: { "subscriptionId": "sub_..." }
```

### Step 2: List Subscriptions
```bash
curl http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer test-api-key-12345"
# Shows all registered devices
```

### Step 3: Send Notification
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "sub_...",
    "notification": {
      "title": "Test",
      "body": "Message"
    }
  }'
```

### Step 4: Unsubscribe
```bash
curl -X DELETE http://localhost:3000/api/unsubscribe?id=sub_...
```

## 📱 Browser Support

Works on:
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+
- ✅ Opera 37+

## 📂 Project Structure

```
app/
  ├── page.tsx              ← Homepage (subscribe UI)
  ├── docs/page.tsx         ← API documentation
  └── api/
      ├── config/route.ts
      ├── subscribe/route.ts
      ├── send/route.ts
      └── unsubscribe/route.ts

lib/
  ├── firebase.ts           ← Database setup
  ├── push-service.ts       ← Web Push logic
  ├── api-auth.ts           ← API key validation
  └── push-client.ts        ← Client-side subscription
```

## 🔑 Environment Variables

All set up in `.env.local`:

```env
# Firebase (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

# VAPID (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=...

# API Keys (production)
PUSH_API_KEYS=test-api-key-12345
```

## 🐛 Troubleshooting

### Notifications not appearing?
- Check browser notification permissions
- Verify you clicked "Subscribe" first
- Check subscription ID is valid

### API returns 401?
- Verify API key in Authorization header
- Format: `Authorization: Bearer YOUR_KEY`
- Default: `test-api-key-12345`

### Service Worker issues?
- Requires HTTPS (or localhost for dev)
- Check browser console for errors
- Verify `/public/sw.js` is accessible

## 📚 Learn More

- **Full API Reference**: Visit `/docs` page
- **README**: See `README.md` for detailed documentation
- **Build Summary**: See `BUILD_SUMMARY.md` for technical details

## 🚢 Ready for Production?

Before deploying to production:

1. Set secure API keys in environment
2. Enable Firebase security rules
3. Configure CORS for your domain
4. Set up error tracking
5. Use HTTPS only
6. Configure rate limiting
7. Monitor Firebase usage

See `README.md` for complete production checklist.

## ✨ Features

- 🔐 API key authentication
- 📱 Multi-device support
- 🎯 Single or batch notifications
- 💾 Firebase Realtime Database
- 🔗 VAPID encrypted delivery
- 📊 Device management UI
- 📖 Complete API documentation
- 🧪 Built-in test interface

## 📞 Need Help?

- Check `/docs` page for API details
- Read `README.md` for full documentation
- Review error messages in API responses
- Check browser console for client-side errors

---

**You're all set!** Start subscribing and sending notifications! 🎉
