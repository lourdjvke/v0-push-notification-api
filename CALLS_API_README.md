# Call API Implementation - Complete Documentation

## Project Overview

A comprehensive real-time video and audio calling API built with WebRTC, integrated with the existing push notification API. This implementation provides a flexible, production-ready platform for adding communication features to applications.

## What Was Built

### Phase 1: Core Call API Endpoints ✅
- **POST /api/calls/create** - Create new call sessions
- **GET /api/calls/:callId/state** - Retrieve call state with participants
- **POST /api/calls/:callId/end** - Gracefully terminate calls
- **POST /api/calls/:callId/tokens** - Generate new participant tokens
- **POST /api/calls/:callId/participants** - Add participants to active calls
- **GET /api/calls/:callId/participants** - List all participants
- **PATCH /api/calls/:callId/participants/:participantId** - Control media streams
- **DELETE /api/calls/:callId/participants/:participantId** - Remove participants

### Phase 2: Recording System & IndexedDB SDK ✅
- **Server-side recording management** with Firebase RTDB storage
- **Client-side recording** with IndexedDB chunking and buffering
- **CallRecorder class** for browser-based recording and upload
- **POST /api/calls/:callId/recording/start** - Start recording
- **POST /api/calls/:callId/recording/stop** - Stop and finalize recording
- **GET /api/calls/:callId/recording/:recordingId** - Retrieve recording metadata
- **Flexible upload endpoints** supporting custom storage backends

### Phase 3: Advanced Features ✅
- **Webhook service** for event notifications with retry logic
- **POST /api/calls/:callId/webhooks** - Register webhooks
- **Quality metrics** endpoint for real-time stats (latency, packet loss, bitrate)
- **GET /api/calls/:callId/participants/:participantId/quality-stats**
- Support for participant.joined, participant.left, call.ended, recording.* events

### Phase 4: Client SDK ✅
- **CallSDK class** - High-level JavaScript/TypeScript API
- **WebRTCManager** - Low-level peer connection management
- **CallRecorder** - Client-side recording with IndexedDB storage
- **Type definitions** for full TypeScript support
- **Event system** for real-time notifications

### Phase 5: Demo & Documentation ✅
- **Interactive demo page** at `/demo/calls` with shareable session links
- **Call management dashboard** at `/dashboard/calls`
- **Integration documentation** at `/calls-one-done`
- Ready-to-use code examples and API reference

## Architecture & Technology Stack

### Backend
- **Framework**: Next.js 16 (App Router)
- **Database**: Firebase Realtime Database
- **Storage**: IndexedDB (client-side)
- **Authentication**: Existing API key system (reused from push API)
- **Language**: TypeScript
- **Validation**: Zod

### Frontend
- **Runtime**: Browser WebRTC API
- **Storage**: IndexedDB for recording chunks
- **UI Framework**: React with shadcn/ui components

### Database Schema (Firebase RTDB)

```
/calls/{callId}
  /metadata (creator, roomId, type, status, timestamps)
  /participants/{participantId} (user info, media state, status)
  /recordings/{recordingId} (format, duration, status, urls)
  /webhooks/{webhookId} (registered endpoints)

/recordings/{recordingId}
  (quick access index)

/webhooks/{webhookId}/deliveries/{deliveryId}
  (delivery logs with retry tracking)
```

## Key Features & Design Decisions

### 1. Authentication Reuse
- Uses existing push notification API keys
- No separate authentication system
- Bearer token or query parameter support

### 2. Flexible Call Types
- Supports video and audio calls
- Graceful downgrade from video to audio if camera unavailable
- Per-call type specification

### 3. Recording Strategy
- **Server-side**: Metadata and lifecycle management
- **Client-side**: Actual media capture to IndexedDB
- **Custom upload**: Third parties define storage backends (S3, Firebase Storage, custom)
- **Automatic chunking**: Large recordings split into manageable chunks

### 4. Token Management
- Short-lived JWT tokens (15 minutes TTL)
- Issued per participant for WebRTC session
- Automatic validation on API endpoints

### 5. Webhook System
- Event-driven architecture
- Exponential backoff retry logic
- Idempotent delivery with attempt tracking
- Supports: participant.joined, participant.left, call.ended, recording.*, quality.degraded

### 6. Quality Monitoring
- Real-time stats collection (latency, packet loss, bitrate)
- Per-participant metrics
- Network quality degradation events
- Optional monitoring (no forced tracking)

## File Structure

```
/app/api/calls/
├── create/route.ts                  # Create call
├── [callId]/
│   ├── state/route.ts              # Get state
│   ├── end/route.ts                # End call
│   ├── tokens/route.ts             # Generate tokens
│   ├── participants/
│   │   ├── route.ts                # Add & list
│   │   └── [participantId]/
│   │       ├── route.ts            # Control & remove
│   │       └── quality-stats/route.ts
│   ├── recording/
│   │   ├── start/route.ts
│   │   ├── stop/route.ts
│   │   └── [recordingId]/route.ts
│   └── webhooks/route.ts

/lib/
├── call-service.ts                 # Business logic
├── call-tokens.ts                  # JWT generation
├── call-schemas.ts                 # Zod validation
├── recording-service.ts            # Recording management
├── webhook-service.ts              # Event delivery
└── client-sdk/
    ├── index.ts                    # Main SDK
    ├── types.ts                    # TypeScript types
    ├── webrtc-manager.ts           # Peer connections
    └── recording.ts                # Client recording

/app/
├── demo/calls/page.tsx             # Interactive demo
├── dashboard/calls/page.tsx        # Calls management
└── calls-one-done/page.tsx         # Integration docs
```

## API Endpoints Summary

### Core Endpoints
```
POST   /api/calls/create
GET    /api/calls/:callId/state
POST   /api/calls/:callId/end
POST   /api/calls/:callId/tokens
```

### Participant Management
```
POST   /api/calls/:callId/participants
GET    /api/calls/:callId/participants
PATCH  /api/calls/:callId/participants/:participantId
DELETE /api/calls/:callId/participants/:participantId
```

### Recording
```
POST   /api/calls/:callId/recording/start
POST   /api/calls/:callId/recording/stop
GET    /api/calls/:callId/recording/:recordingId
```

### Advanced Features
```
POST   /api/calls/:callId/webhooks
GET    /api/calls/:callId/webhooks
DELETE /api/calls/:callId/webhooks?webhookId=X
GET    /api/calls/:callId/participants/:participantId/quality-stats
```

## Usage Examples

### Creating a Call
```javascript
const response = await fetch('/api/calls/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomId: 'my-meeting-room',
    type: 'video',
    maxParticipants: 10
  })
});

const { callId, token, participantId } = await response.json();
```

### Using the Client SDK
```javascript
import { CallSDK } from '@/lib/client-sdk';

const sdk = new CallSDK({
  apiKey: 'YOUR_API_KEY',
  apiEndpoint: 'https://your-api.com'
});

const session = await sdk.createCall({ roomId: 'my-room' });
await sdk.joinCall(session.token);

sdk.on('participant:joined', ({ participant }) => {
  console.log('New participant:', participant.participantId);
});

await sdk.toggleAudio(true);
await sdk.toggleVideo(true);

// Start recording
await sdk.startRecording(localStream);

// Leave call
await sdk.leaveCall();
```

### Registering Webhooks
```javascript
await fetch('/api/calls/CALL_ID/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-server.com/webhook',
    events: ['participant.joined', 'participant.left', 'call.ended'],
    retryPolicy: { maxRetries: 3, retryDelay: 1000 }
  })
});
```

## Security Considerations

1. **API Key Validation**: All requests validated against existing push API keys
2. **Token TTL**: Call tokens expire after 15 minutes
3. **CORS**: Uses existing CORS setup from push API
4. **Data Isolation**: Calls and participants scoped by creator email
5. **Recording Privacy**: Client-side recording stays in user's IndexedDB until upload

## Production Readiness

### Implemented
- Error handling with specific error codes
- Input validation with Zod schemas
- Firebase RTDB integration
- Retry logic for webhooks
- Token expiration and validation
- CORS headers
- Comprehensive logging

### Recommended Additions
- Rate limiting per API key
- Call duration limits
- Participant count enforcement
- Recording storage cleanup jobs
- Metrics and monitoring (Datadog, Sentry)
- Webhook delivery SLA tracking
- Database connection pooling
- Caching layer (Redis) for active calls

## Testing Guide

1. **Demo Page**: `/demo/calls`
   - Create test calls with your API key
   - Test participant controls
   - Share session links
   - Monitor call metrics

2. **Dashboard**: `/dashboard/calls`
   - View active and recent calls
   - Monitor participants
   - End calls remotely

3. **Integration Guide**: `/calls-one-done`
   - Copy-paste code examples
   - Review API reference
   - Test webhook examples

## Maintenance & Updates

### Code Organization
- Service layer (`*-service.ts`) handles business logic
- API routes strictly for request/response handling
- Schemas (`*-schemas.ts`) ensure type safety
- Client SDK encapsulates browser APIs

### Adding Features
1. Add schema in `call-schemas.ts`
2. Add business logic in service file
3. Create API endpoint using existing patterns
4. Update client SDK if needed

### Monitoring
- Check `[v0]` console logs for debugging
- Firebase console for data inspection
- Webhook delivery logs in database

## Notes & Limitations

1. **STUN/TURN Servers**: Uses Google's public STUN. Production should add TURN servers for NAT traversal.
2. **Scaling**: Firebase RTDB suitable for <10k concurrent calls. Consider migration path to PostgreSQL + Redis for larger scale.
3. **Recording**: IndexedDB has 50MB-1GB limits per origin. Apps should implement cleanup and upload strategies.
4. **Bandwidth**: No bandwidth limit enforcement. Consider adding bitrate/resolution constraints per call type.
5. **Transcription**: Optional feature (placeholder). Integration with external service (Deepgram, Google Cloud Speech) needed.

## Backward Compatibility

The Call API is **completely additive** and does not modify any existing endpoints:
- Push notification endpoints remain unchanged
- API key validation reused as-is
- Firebase database structure separate from push API
- Existing clients/integrations unaffected

## Next Steps

1. Test with the demo page and your own API key
2. Review integration documentation at `/calls-one-done`
3. Integrate client SDK into your application
4. Set up webhooks for call lifecycle events
5. Configure custom recording upload endpoints
6. Add monitoring and error tracking
7. Test failover and recovery scenarios
8. Load test with expected participant counts

---

**Built with comprehensive error handling, production-ready architecture, and full flexibility for third-party integrations.**
