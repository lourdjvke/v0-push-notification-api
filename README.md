# Push Notification Service API

A complete Web Push Notification API built with Next.js, Firebase Realtime Database, and VAPID encryption. Send push notifications to subscribed devices with a full-featured UI and comprehensive API.

## Features

✅ **Web Push API Support** - VAPID-secured push notifications  
✅ **Firebase RTDB Integration** - Persistent subscription storage  
✅ **API Key Authentication** - Secure endpoints with Bearer token auth  
✅ **Service Worker** - Client-side notification handling  
✅ **Device Management** - Subscribe/unsubscribe devices with friendly names  
✅ **Test Interface** - Built-in UI to test notifications  
✅ **Documentation** - Complete API reference with code examples  
✅ **Batch Notifications** - Send to single or multiple subscriptions  
✅ **Custom Data** - Include custom payloads with notifications  

## Architecture

### Backend Structure

- **API Routes** (`/app/api/`)
  - `POST /api/subscribe` - Register device subscription
  - `GET /api/subscribe` - List all subscriptions (requires API key)
  - `POST /api/send` - Send notifications (requires API key)
  - `DELETE /api/unsubscribe` - Unsubscribe device
  - `GET /api/config` - Get VAPID public key

- **Libraries** (`/lib/`)
  - `firebase.ts` - Firebase initialization and database utils
  - `push-service.ts` - Web Push service with VAPID setup
  - `api-auth.ts` - API key validation middleware
  - `push-client.ts` - Client-side subscription management

- **Service Worker** (`/public/sw.js`)
  - Handles incoming push events
  - Displays notifications
  - Manages notification clicks

### Frontend

- **Homepage** (`/app/page.tsx`) - Main interface for:
  - Device subscription/unsubscription
  - Subscription ID display
  - Sending test notifications
  - Viewing all registered devices

- **Documentation** (`/app/docs/page.tsx`) - Complete API reference:
  - Authentication guide
  - Endpoint specifications
  - Code examples (cURL, JavaScript, Python)
  - Error handling
  - Configuration

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

Or with npm/yarn:
```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration (Public - safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDkIGFjmEpUIyENed5Zx7GG3krQFV2U5aE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=insafe-ng.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://insafe-ng-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=insafe-ng
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=insafe-ng.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=219620010651
NEXT_PUBLIC_FIREBASE_APP_ID=1:219620010651:web:cf59b5f604338a52f2b43e

# VAPID Configuration (Public key safe for browser)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGLbLfrYWC5npSRnE1QrNXZQrvnlkLommK6OvZUeUNrNKpFbKTFQkLvT0_19CiYeXsHGMs7DdAGPErC25BLTaPA

# VAPID Configuration (Server-only - keep secret!)
VAPID_PRIVATE_KEY=tNSV_sKfaT_2NiRDZIM2F_yAEt6iPgX7JL-EmcGg44Q
VAPID_SUBJECT=mailto:powercomssocials@gmail.com

# API Keys (Server-only - keep secret!)
# Comma-separated list of valid API keys
PUSH_API_KEYS=test-api-key-12345,your-production-key-here
```

### 3. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## API Usage

### Quick Start

#### 1. Subscribe a Device

```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://...",
      "keys": {
        "auth": "...",
        "p256dh": "..."
      }
    },
    "deviceName": "My Laptop"
  }'
```

Response:
```json
{
  "message": "Successfully subscribed to push notifications",
  "subscriptionId": "sub_1234567890_abc123"
}
```

#### 2. Send Notification

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionId": "sub_1234567890_abc123",
    "notification": {
      "title": "Hello!",
      "body": "This is a test notification",
      "icon": "https://example.com/icon.png"
    }
  }'
```

#### 3. Send to Multiple Devices

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key-12345" \
  -d '{
    "subscriptionIds": [
      "sub_1234567890_abc123",
      "sub_9876543210_xyz789"
    ],
    "notification": {
      "title": "Broadcast Message",
      "body": "Sent to multiple devices"
    }
  }'
```

## Notification Payload Format

```json
{
  "subscriptionId": "sub_1234567890_abc123",
  "notification": {
    "title": "Required - Notification title",
    "body": "Required - Notification body/message",
    "icon": "Optional - URL to icon image",
    "badge": "Optional - URL to badge image",
    "data": {
      "optional": "custom data object"
    }
  }
}
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscribe` | ❌ | Register device subscription |
| GET | `/api/subscribe` | ✅ | List all subscriptions |
| POST | `/api/send` | ✅ | Send notifications |
| DELETE | `/api/unsubscribe` | ❌ | Unsubscribe device |
| GET | `/api/config` | ❌ | Get VAPID public key |

**✅ = Requires API key in Authorization header**

## Authentication

Protected endpoints require an API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

The default API key is `test-api-key-12345`. For production, use environment variables to set multiple secure keys via `PUSH_API_KEYS`.

## File Structure

```
push-notification-api/
├── app/
│   ├── api/
│   │   ├── subscribe/route.ts
│   │   ├── send/route.ts
│   │   ├── unsubscribe/route.ts
│   │   └── config/route.ts
│   ├── docs/
│   │   └── page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── firebase.ts
│   ├── push-service.ts
│   ├── api-auth.ts
│   └── push-client.ts
├── public/
│   └── sw.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Database Schema

### Firebase Realtime Database

```
subscriptions/
├── sub_1234567890_abc123/
│   ├── id: "sub_1234567890_abc123"
│   ├── endpoint: "https://fcm.googleapis.com/..."
│   ├── auth: "authentication_key"
│   ├── p256dh: "public_key"
│   ├── deviceName: "My Device"
│   ├── userAgent: "Mozilla/5.0..."
│   ├── subscribedAt: "2024-01-15T10:30:00Z"
│   └── expirationTime: null
```

## Testing

### Using the Web Interface

1. Navigate to `http://localhost:3000`
2. Click "Subscribe" to subscribe your device
3. Copy your Subscription ID
4. Fill in notification title and body
5. Click "Send Test Notification"
6. Verify notification appears on your device

### Using cURL

See API Usage section above for examples.

### Using JavaScript

```javascript
const response = await fetch('/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-api-key-12345'
  },
  body: JSON.stringify({
    subscriptionId: 'sub_1234567890_abc123',
    notification: {
      title: 'Hello',
      body: 'This is a test notification'
    }
  })
});

const result = await response.json();
console.log(result);
```

## Browser Support

- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+
- Opera 37+

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid request format or missing fields |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Subscription ID not found |
| 500 | Server Error | Internal server error during notification send |

## Troubleshooting

### Service Worker Not Registering

- Ensure you're on HTTPS (or localhost for development)
- Check browser console for errors
- Verify `/public/sw.js` is accessible

### Notifications Not Appearing

- Check browser notification permissions
- Verify device is subscribed (check subscriptions list)
- Check subscription ID is valid
- Ensure notification title and body are provided

### API Key Errors

- Verify API key is correct
- Check header format: `Authorization: Bearer YOUR_KEY`
- Ensure PUSH_API_KEYS environment variable is set

## Deployment

### Deploy to Vercel

```bash
pnpm build
vercel deploy
```

Set environment variables in Vercel project settings before deploying.

### Deploy Elsewhere

1. Build the project: `pnpm build`
2. Start the server: `pnpm start`
3. Ensure Node.js 18+ is installed
4. Set all environment variables

## Security Considerations

- **API Keys**: Keep `VAPID_PRIVATE_KEY` and `PUSH_API_KEYS` secret
- **HTTPS Required**: Push notifications require HTTPS (except localhost)
- **CORS**: Configure CORS if accessing from different domains
- **Rate Limiting**: Consider adding rate limiting for production
- **Input Validation**: All inputs are validated on server
- **Database Security**: Firebase RLS should restrict access appropriately

## Production Checklist

- [ ] Set secure API keys in environment variables
- [ ] Enable Firebase security rules
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting
- [ ] Use HTTPS
- [ ] Monitor Firebase quota usage
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Test notification delivery at scale

## License

MIT

## Support

For issues and questions, check the `/docs` page for complete API documentation or contact the development team.
