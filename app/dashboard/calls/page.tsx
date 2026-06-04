'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  Users,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  VideoIcon,
  MicIcon,
} from 'lucide-react';

interface CallInfo {
  callId: string;
  roomId: string;
  type: 'video' | 'audio';
  status: 'active' | 'ended' | 'error';
  participantCount: number;
  duration?: number;
  createdAt: string;
  endedAt?: string;
}

export default function CallsDashboardPage() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [calls, setCalls] = useState<CallInfo[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('calls_dashboard_email');
    const savedApiKey = localStorage.getItem('calls_dashboard_apikey');
    if (savedEmail) setEmail(savedEmail);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  async function handleLoadCalls() {
    if (!email || !apiKey) {
      toast.error('Email and API key are required');
      return;
    }

    try {
      setLoading(true);
      localStorage.setItem('calls_dashboard_email', email);
      localStorage.setItem('calls_dashboard_apikey', apiKey);

      // In a real implementation, you would fetch from an API endpoint
      // For now, we'll show a placeholder
      toast.info('Calls management feature coming soon');
      
      // Mock data
      setCalls([
        {
          callId: 'call_1720000000_abc123',
          roomId: 'meeting-room-1',
          type: 'video',
          status: 'active',
          participantCount: 3,
          duration: 1200,
          createdAt: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          callId: 'call_1720000001_def456',
          roomId: 'interview-room',
          type: 'audio',
          status: 'ended',
          participantCount: 2,
          duration: 900,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          endedAt: new Date(Date.now() - 2700000).toISOString(),
        },
      ]);
    } catch (error: any) {
      toast.error('Failed to load calls');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!email || !apiKey) return;
    await handleLoadCalls();
  }

  async function handleEndCall(callId: string) {
    if (!confirm('Are you sure you want to end this call?')) return;

    try {
      setRefreshing(true);
      const endpoint = localStorage.getItem('calls_api_endpoint') || window.location.origin;
      
      const response = await fetch(`${endpoint}/api/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        toast.success('Call ended');
        await handleRefresh();
      } else {
        const error = await response.json();
        toast.error(`Failed to end call: ${error.error}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  function formatDuration(seconds?: number) {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle>Calls Management</CardTitle>
            <CardDescription>
              Monitor and manage your active calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="your-api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleLoadCalls}
                disabled={!email || !apiKey || loading}
              >
                {loading ? 'Loading...' : 'Load Calls'}
              </Button>
              {calls.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {calls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Calls</div>
                <div className="text-3xl font-bold">{calls.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Active Calls</div>
                <div className="text-3xl font-bold">
                  {calls.filter(c => c.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Participants</div>
                <div className="text-3xl font-bold">
                  {calls.reduce((sum, c) => sum + c.participantCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Minutes</div>
                <div className="text-3xl font-bold">
                  {Math.floor(
                    calls.reduce((sum, c) => sum + (c.duration || 0), 0) / 60
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calls List */}
        {calls.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Active & Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calls.map((call) => (
                  <div
                    key={call.callId}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{call.roomId}</h4>
                          <Badge variant={call.status === 'active' ? 'default' : 'secondary'}>
                            {call.status}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            {call.type === 'video' ? (
                              <VideoIcon className="w-3 h-3" />
                            ) : (
                              <MicIcon className="w-3 h-3" />
                            )}
                            {call.type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Call ID</div>
                            <div className="text-xs font-mono">{call.callId.slice(0, 20)}...</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Participants
                            </div>
                            <div className="text-lg font-semibold">{call.participantCount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Duration
                            </div>
                            <div className="text-sm">{formatDuration(call.duration)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Created</div>
                            <div className="text-sm">
                              {new Date(call.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Full Call ID: {call.callId}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCall(call)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                        {call.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEndCall(call.callId)}
                            disabled={refreshing}
                            className="gap-2"
                          >
                            <PhoneOff className="w-4 h-4" />
                            End Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : email && !loading ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Calls Found</h3>
              <p className="text-muted-foreground">
                No active or recent calls for this API key. Create one in the demo page.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Call Details Modal */}
        {selectedCall && (
          <Card className="border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Call Details: {selectedCall.roomId}</CardTitle>
                  <CardDescription>Complete call information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCall(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Call ID</label>
                  <p className="font-mono text-sm break-all">{selectedCall.callId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Room ID</label>
                  <p className="font-semibold">{selectedCall.roomId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Type</label>
                  <p className="font-semibold capitalize">{selectedCall.type}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <p className="font-semibold">{selectedCall.status}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Participants</label>
                  <p className="font-semibold">{selectedCall.participantCount}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <p className="font-semibold">{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(selectedCall.createdAt).toLocaleString()}</p>
                </div>
                {selectedCall.endedAt && (
                  <div>
                    <label className="text-sm text-muted-foreground">Ended</label>
                    <p className="text-sm">{new Date(selectedCall.endedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
