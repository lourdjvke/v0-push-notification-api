'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Copy,
  Settings,
  Users,
  Clock,
} from 'lucide-react';

interface CallSession {
  callId: string;
  participantId: string;
  token: string;
  expiresIn: number;
  iceServers?: RTCIceServer[];
  createdAt: string;
}

interface CallState {
  callId: string;
  roomId: string;
  type: 'video' | 'audio';
  status: 'active' | 'ended' | 'error';
  participantCount: number;
  participants: any[];
  duration?: number;
  createdAt: string;
  endedAt?: string;
}

export default function CallsDemoPage() {
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [roomId, setRoomId] = useState('');
  const [callType, setCallType] = useState<'video' | 'audio'>('video');

  // Call session state
  const [session, setSession] = useState<CallSession | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [sessionLink, setSessionLink] = useState('');

  // Media state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for call duration
  useEffect(() => {
    if (isCallActive && session) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive, session]);

  // Ensure we're mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load demo settings from localStorage
  useEffect(() => {
    if (!mounted) return;
    
    const saved = localStorage.getItem('calls_demo_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setApiKey(settings.apiKey || '');
        setApiEndpoint(settings.apiEndpoint || window.location.origin);
      } catch (e) {
        console.error('[v0] Failed to load settings:', e);
      }
    } else {
      setApiEndpoint(window.location.origin);
    }
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  async function handleCreateCall() {
    if (!apiKey) {
      toast.error('Please enter your API key');
      return;
    }
    if (!roomId) {
      toast.error('Please enter a room ID');
      return;
    }

    try {
      setLoading(true);
      const endpoint = apiEndpoint || window.location.origin;

      const response = await fetch(`${endpoint}/api/calls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          roomId,
          type: callType,
          maxParticipants: 10,
          metadata: { demo: true },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Failed to create call: ${error.error || response.statusText}`);
        return;
      }

      const callSession: CallSession = await response.json();
      setSession(callSession);

      // Create shareable link
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams({
          apiKey,
          callId: callSession.callId,
          token: callSession.token,
          participantId: callSession.participantId,
        });
        const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        setSessionLink(link);
      }

      // Save settings
      localStorage.setItem(
        'calls_demo_settings',
        JSON.stringify({ apiKey, apiEndpoint: endpoint })
      );

      // Get initial call state
      const stateResponse = await fetch(`${endpoint}/api/calls/${callSession.callId}/state`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (stateResponse.ok) {
        setCallState(await stateResponse.json());
      }

      toast.success('Call created! Share the link with others.');
      setIsCallActive(true);
      setCallDuration(0);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error('[v0] Create call error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndCall() {
    if (!session) return;

    try {
      setLoading(true);
      const endpoint = apiEndpoint || window.location.origin;

      const response = await fetch(`${endpoint}/api/calls/${session.callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Failed to end call: ${error.error || response.statusText}`);
        return;
      }

      toast.success('Call ended');
      setIsCallActive(false);
      setSession(null);
      setCallState(null);
      setSessionLink('');
      setCallDuration(0);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error('[v0] End call error:', error);
    } finally {
      setLoading(false);
    }
  }

  function copySessionLink() {
    navigator.clipboard.writeText(sessionLink);
    toast.success('Session link copied to clipboard');
  }

  async function handleToggleAudio() {
    setAudioEnabled(!audioEnabled);
    if (session) {
      try {
        const endpoint = apiEndpoint || window.location.origin;
        await fetch(
          `${endpoint}/api/calls/${session.callId}/participants/${session.participantId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ audioEnabled: !audioEnabled }),
          }
        );
      } catch (error) {
        console.error('[v0] Toggle audio error:', error);
      }
    }
  }

  async function handleToggleVideo() {
    setVideoEnabled(!videoEnabled);
    if (session) {
      try {
        const endpoint = apiEndpoint || window.location.origin;
        await fetch(
          `${endpoint}/api/calls/${session.callId}/participants/${session.participantId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ videoEnabled: !videoEnabled }),
          }
        );
      } catch (error) {
        console.error('[v0] Toggle video error:', error);
      }
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Call API Demo</h1>
          <p className="text-muted-foreground">
            Test the real-time calling API with WebRTC support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    placeholder="your-api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isCallActive}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">API Endpoint</label>
                  <Input
                    placeholder={window.location.origin}
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    disabled={isCallActive}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Room ID</label>
                  <Input
                    placeholder="room-name-or-id"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={isCallActive}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Call Type</label>
                  <div className="flex gap-2">
                    <Button
                      variant={callType === 'video' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCallType('video')}
                      disabled={isCallActive}
                      className="flex-1"
                    >
                      Video
                    </Button>
                    <Button
                      variant={callType === 'audio' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCallType('audio')}
                      disabled={isCallActive}
                      className="flex-1"
                    >
                      Audio
                    </Button>
                  </div>
                </div>

                {!isCallActive ? (
                  <Button
                    onClick={handleCreateCall}
                    disabled={!apiKey || !roomId || loading}
                    className="w-full"
                  >
                    {loading ? 'Creating...' : 'Create Call'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndCall}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? 'Ending...' : 'End Call'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Media Controls */}
            {isCallActive && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Media Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={audioEnabled ? 'default' : 'destructive'}
                    className="w-full gap-2"
                    onClick={handleToggleAudio}
                  >
                    {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    {audioEnabled ? 'Audio On' : 'Audio Off'}
                  </Button>

                  <Button
                    variant={videoEnabled ? 'default' : 'destructive'}
                    className="w-full gap-2"
                    onClick={handleToggleVideo}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    {videoEnabled ? 'Video On' : 'Video Off'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call Status */}
            {isCallActive && session && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      Call Active
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDuration(callDuration)}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Participants</div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {callState?.participantCount || 1}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Call Type</div>
                      <div className="text-lg font-semibold capitalize">{callType}</div>
                    </div>
                  </div>

                  {/* Share Session Link */}
                  {sessionLink && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium">Share Session Link</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={sessionLink}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={copySessionLink}
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this link to allow others to join the call
                      </p>
                    </div>
                  )}

                  {/* Call ID */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground">Call ID</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                      {session.callId}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isCallActive && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter your API key and room ID to create a new call session.
                    You can then share the session link with others to join.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The demo page will display real-time call information, participant
                    count, and media controls once a call is active.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            {isCallActive && callState && callState.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants ({callState.participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {callState.participants.map((participant) => (
                      <div
                        key={participant.participantId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {participant.userName || `Participant ${participant.participantId.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            {participant.audioEnabled && <span className="text-green-600">Audio On</span>}
                            {!participant.audioEnabled && <span className="text-red-600">Audio Off</span>}
                            {participant.videoEnabled && <span className="text-green-600">Video On</span>}
                            {!participant.videoEnabled && <span className="text-red-600">Video Off</span>}
                          </div>
                        </div>
                        <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                          {participant.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Start */}
            {!isCallActive && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>Get started with the Call API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Enter API Key</h4>
                    <p className="text-sm text-muted-foreground">
                      Use your existing push notification API key or create a new one in the dashboard
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Create Room</h4>
                    <p className="text-sm text-muted-foreground">
                      Specify a room ID to organize your calls
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. Create Call</h4>
                    <p className="text-sm text-muted-foreground">
                      Click &quot;Create Call&quot; to initialize a new WebRTC session
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. Share Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy and share the session link to invite others to join the call
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
