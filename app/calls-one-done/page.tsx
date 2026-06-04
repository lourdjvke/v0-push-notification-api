'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CallsOneDonePage() {
  const [copiedCode, setCopiedCode] = useState<string>('');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const codeSnippets = {
    'create-call': `// Create a new call session
const response = await fetch('https://your-api.com/api/calls/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    roomId: 'my-meeting-room',
    type: 'video', // or 'audio'
    maxParticipants: 10,
    metadata: { customField: 'value' }
  })
});

const { callId, token, participantId, iceServers } = await response.json();
console.log('Call created:', callId);`,

    'get-state': `// Get current call state with participants
const response = await fetch(
  'https://your-api.com/api/calls/CALL_ID/state',
  {
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  }
);

const callState = await response.json();
console.log('Participants:', callState.participants);
console.log('Duration:', callState.duration);`,

    'add-participant': `// Add a new participant to active call
const response = await fetch(
  'https://your-api.com/api/calls/CALL_ID/participants',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      userId: 'user-123',
      userName: 'John Doe',
      metadata: { role: 'presenter' }
    })
  }
);

const { participantId, joinToken } = await response.json();`,

    'recording': `// Start recording a call
const startResponse = await fetch(
  'https://your-api.com/api/calls/CALL_ID/recording/start',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      format: 'webm',
      includeAudio: true,
      includeVideo: true,
      layout: 'grid'
    })
  }
);

const { recordingId } = await startResponse.json();

// Stop recording
const stopResponse = await fetch(
  'https://your-api.com/api/calls/CALL_ID/recording/stop',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  }
);`,

    'client-sdk': `// Using the Call SDK
import { CallSDK } from '@/lib/client-sdk';

const sdk = new CallSDK({
  apiKey: 'YOUR_API_KEY',
  apiEndpoint: 'https://your-api.com'
});

// Create a call
const session = await sdk.createCall({
  roomId: 'my-room',
  type: 'video',
  maxParticipants: 10
});

// Join the call
await sdk.joinCall(session.token);

// Toggle media
await sdk.toggleAudio(true);
await sdk.toggleVideo(true);

// Start recording
await sdk.startRecording(localMediaStream);

// Listen to events
sdk.on('participant:joined', ({ participant }) => {
  console.log('New participant:', participant.participantId);
});

// Leave call
await sdk.leaveCall();`,

    'webhook': `// Register webhooks for call events
const response = await fetch(
  'https://your-api.com/api/calls/CALL_ID/webhooks',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      url: 'https://your-server.com/webhooks/call-events',
      events: [
        'participant.joined',
        'participant.left',
        'call.ended',
        'recording.stopped'
      ],
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000
      }
    })
  }
);

// Your webhook handler (Next.js API route)
export async function POST(request: Request) {
  const { event, callId, timestamp, data } = await request.json();
  
  console.log(\`Event: \${event} for call \${callId}\`);
  
  if (event === 'participant.joined') {
    console.log('New participant:', data.participantId);
  }
  
  return Response.json({ received: true });
}`,

    'quality-stats': `// Get real-time quality stats for a participant
const response = await fetch(
  'https://your-api.com/api/calls/CALL_ID/participants/PARTICIPANT_ID/quality-stats',
  {
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  }
);

const { stats } = await response.json();
console.log('Latency:', stats.latencyMs, 'ms');
console.log('Packet Loss:', stats.packetLoss, '%');
console.log('Bitrate:', stats.bitrate, 'kbps');`,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Badge className="mb-4">Integration Guide</Badge>
          <h1 className="text-5xl font-bold mb-4">Call API Integration</h1>
          <p className="text-xl text-muted-foreground">
            Complete guide to integrating the real-time calling API into your application
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><a href="#overview" className="text-blue-600 hover:underline">Overview</a></li>
              <li><a href="#authentication" className="text-blue-600 hover:underline">Authentication</a></li>
              <li><a href="#creating-calls" className="text-blue-600 hover:underline">Creating Calls</a></li>
              <li><a href="#managing-participants" className="text-blue-600 hover:underline">Managing Participants</a></li>
              <li><a href="#recording" className="text-blue-600 hover:underline">Recording Calls</a></li>
              <li><a href="#client-sdk" className="text-blue-600 hover:underline">Client SDK</a></li>
              <li><a href="#webhooks" className="text-blue-600 hover:underline">Webhooks & Events</a></li>
              <li><a href="#quality" className="text-blue-600 hover:underline">Quality Monitoring</a></li>
              <li><a href="#errors" className="text-blue-600 hover:underline">Error Handling</a></li>
            </ul>
          </CardContent>
        </Card>

        {/* Overview */}
        <section id="overview" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Call API enables real-time video and audio calling with WebRTC, providing a flexible
                and production-ready platform for integrating communication features into your application.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Video and audio calling with WebRTC</li>
                  <li>Flexible session management and participant control</li>
                  <li>Client-side recording with IndexedDB storage</li>
                  <li>Webhook events for call lifecycle</li>
                  <li>Real-time quality metrics and monitoring</li>
                  <li>Graceful audio/video fallback</li>
                  <li>Custom metadata and integration options</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Authentication */}
        <section id="authentication" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>All API requests require your API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Use the same API key from your push notification setup. Provide it via Authorization header or query parameter.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Via Header:</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Authorization: Bearer YOUR_API_KEY`}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Via Query Parameter:</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`/api/calls/create?apikey=YOUR_API_KEY`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Creating Calls */}
        <section id="creating-calls" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Creating Calls</CardTitle>
              <CardDescription>Initialize a new call session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                To start a call, send a POST request to <code className="bg-muted px-2 py-1 rounded">/api/calls/create</code>.
                The response includes a call ID, participant ID, and access token.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Example Request:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['create-call'], 'create-call')}
                    className="gap-2"
                  >
                    {copiedCode === 'create-call' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['create-call']}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Managing Participants */}
        <section id="managing-participants" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Managing Participants</CardTitle>
              <CardDescription>Add, control, and remove participants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Once a call is created, you can add new participants, control their media streams, and remove them.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Add Participant:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['add-participant'], 'add-participant')}
                    className="gap-2"
                  >
                    {copiedCode === 'add-participant' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['add-participant']}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Endpoints:</h4>
                <ul className="space-y-1 text-sm">
                  <li><code className="bg-muted px-2 py-1 rounded">POST /api/calls/:callId/participants</code> - Add participant</li>
                  <li><code className="bg-muted px-2 py-1 rounded">GET /api/calls/:callId/participants</code> - List participants</li>
                  <li><code className="bg-muted px-2 py-1 rounded">PATCH /api/calls/:callId/participants/:participantId</code> - Control media</li>
                  <li><code className="bg-muted px-2 py-1 rounded">DELETE /api/calls/:callId/participants/:participantId</code> - Remove participant</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recording */}
        <section id="recording" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recording Calls</CardTitle>
              <CardDescription>Capture and store call recordings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Recordings are handled both server-side (metadata) and client-side (actual media). The client SDK provides
                IndexedDB storage with automatic chunking and flexible upload endpoints.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Example (Server-side):</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['recording'], 'recording')}
                    className="gap-2"
                  >
                    {copiedCode === 'recording' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['recording']}
                </pre>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Client-Side Recording:</h4>
                <p className="text-sm">Use the CallRecorder class to record locally and upload to your custom endpoint.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Client SDK */}
        <section id="client-sdk" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Client SDK</CardTitle>
              <CardDescription>High-level JavaScript/TypeScript API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Call SDK provides a simple interface for managing calls from the browser, including media control,
                screen sharing, and client-side recording.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Usage Example:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['client-sdk'], 'client-sdk')}
                    className="gap-2"
                  >
                    {copiedCode === 'client-sdk' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['client-sdk']}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Webhooks */}
        <section id="webhooks" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks & Events</CardTitle>
              <CardDescription>Receive real-time notifications of call events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Register webhooks to receive notifications when call events occur. Events include participant joins/leaves,
                call end, recording completion, and quality degradation.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Register Webhook & Handler:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['webhook'], 'webhook')}
                    className="gap-2"
                  >
                    {copiedCode === 'webhook' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['webhook']}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Available Events:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><code>participant.joined</code> - New participant joins the call</li>
                  <li><code>participant.left</code> - Participant leaves the call</li>
                  <li><code>call.ended</code> - Call ends</li>
                  <li><code>recording.started</code> - Recording begins</li>
                  <li><code>recording.stopped</code> - Recording completes</li>
                  <li><code>quality.degraded</code> - Network quality drops below threshold</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quality Monitoring */}
        <section id="quality" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quality Monitoring</CardTitle>
              <CardDescription>Track and respond to network quality changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Monitor real-time quality metrics for each participant, including latency, packet loss, bitrate, and resolution.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Get Quality Stats:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(codeSnippets['quality-stats'], 'quality-stats')}
                    className="gap-2"
                  >
                    {copiedCode === 'quality-stats' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{codeSnippets['quality-stats']}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error Handling */}
        <section id="errors" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
              <CardDescription>Common errors and recovery strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">MEDIA_NOT_PERMITTED (403)</h4>
                  <p className="text-sm text-muted-foreground">User denied camera/mic access. Request permissions again.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">ICE_FAILED (500)</h4>
                  <p className="text-sm text-muted-foreground">Failed to establish peer connection. Try alternative TURN servers.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">STORAGE_QUOTA_EXCEEDED (413)</h4>
                  <p className="text-sm text-muted-foreground">IndexedDB full. Clear old recordings or upload and delete chunks.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">INVALID_TOKEN (401)</h4>
                  <p className="text-sm text-muted-foreground">Call token expired. Generate a new token for the participant.</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-1">CALL_ENDED (410)</h4>
                  <p className="text-sm text-muted-foreground">Call has ended. Cannot add participants or join.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Demo */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Try It Out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Visit the <a href="/demo/calls" className="text-blue-600 hover:underline">demo page</a> to test
                the Call API with your own API key. Or check the <a href="/dashboard/calls" className="text-blue-600 hover:underline">calls management dashboard</a> to monitor
                active calls.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
