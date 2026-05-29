'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Trash2, Plus, Eye, EyeOff, BarChart3, Send } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  key?: string;
}

interface Subscriber {
  subscriptionId: string;
  deviceName: string;
  subscribedAt: string;
  stats: {
    notificationsReceived: number;
    notificationsOpened: number;
    notificationsClicked: number;
  };
}

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [analyticsModal, setAnalyticsModal] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [bulkNotifyModal, setBulkNotifyModal] = useState<string | null>(null);
  const [bulkNotifyTitle, setBulkNotifyTitle] = useState('');
  const [bulkNotifyBody, setBulkNotifyBody] = useState('');
  const [bulkNotifyImage, setBulkNotifyImage] = useState('');
  const [bulkNotifySending, setBulkNotifySending] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('dashboard_email');
    if (savedEmail) {
      setEmail(savedEmail);
      fetchKeys(savedEmail);
    }
  }, []);

  async function fetchKeys(userEmail: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/keys?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error: any) {
      toast.error('Failed to load API keys');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!email || !newKeyName.trim()) {
      toast.error('Email and key name are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: newKeyName }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('dashboard_email', email);
        toast.success('API key created successfully');
        setNewKeyName('');
        fetchKeys(email);
        
        setTimeout(() => {
          alert(`Save this key somewhere safe:\n\n${data.key}\n\nYou won't see it again!`);
        }, 500);
      } else {
        toast.error(data.error || 'Failed to create API key');
      }
    } catch (error: any) {
      toast.error('Failed to create API key');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/keys?email=${encodeURIComponent(email)}&keyId=${keyId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('API key deleted');
        fetchKeys(email);
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error: any) {
      toast.error('Failed to delete API key');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function toggleKeyVisibility(keyId: string) {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  }

  async function fetchAnalytics(apiKey: string) {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(
        `/api/analytics/by-key?apikey=${encodeURIComponent(apiKey)}`
      );
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function handleBulkNotify(apiKey: string) {
    if (!bulkNotifyTitle.trim() || !bulkNotifyBody.trim()) {
      toast.error('Title and body are required');
      return;
    }

    try {
      setBulkNotifySending(true);
      
      // First get all subscriber IDs for this key
      const analyticsResponse = await fetch(
        `/api/analytics/by-key?apikey=${encodeURIComponent(apiKey)}`
      );
      const analyticsData = await analyticsResponse.json();
      
      if (!analyticsData.subscribers || analyticsData.subscribers.length === 0) {
        toast.error('No subscribers for this API key');
        return;
      }

      const subscriptionIds = analyticsData.subscribers.map(
        (sub: Subscriber) => sub.subscriptionId
      );

      // Send notifications
      const sendResponse = await fetch(
        `/api/send?apikey=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionIds,
            notification: {
              title: bulkNotifyTitle,
              body: bulkNotifyBody,
              image: bulkNotifyImage || undefined,
            },
          }),
        }
      );

      const sendData = await sendResponse.json();

      if (sendResponse.ok) {
        toast.success(
          `Notifications sent to ${subscriptionIds.length} subscriber(s)`
        );
        setBulkNotifyModal(null);
        setBulkNotifyTitle('');
        setBulkNotifyBody('');
        setBulkNotifyImage('');
      } else {
        toast.error(sendData.error || 'Failed to send notifications');
      }
    } catch (error: any) {
      toast.error('Failed to send notifications');
      console.error(error);
    } finally {
      setBulkNotifySending(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Email Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Email Login</CardTitle>
            <CardDescription>
              Enter your email to access and manage your API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && email) {
                    localStorage.setItem('dashboard_email', email);
                    fetchKeys(email);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (email) {
                    localStorage.setItem('dashboard_email', email);
                    fetchKeys(email);
                  }
                }}
                disabled={!email || loading}
              >
                Load Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        {email && (
          <>
            {/* Create New Key */}
            <Card>
              <CardHeader>
                <CardTitle>Create New API Key</CardTitle>
                <CardDescription>
                  Generate a new API key for your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (e.g., Production, Testing)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateKey();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || loading}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Keys List */}
            <Card>
              <CardHeader>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                {keys.length === 0 ? (
                  <p className="text-muted-foreground">No API keys yet. Create one above.</p>
                ) : (
                  <div className="space-y-4">
                    {keys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{key.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                          </div>
                          {key.lastUsed && (
                            <div className="text-sm text-muted-foreground">
                              Last used: {new Date(key.lastUsed).toLocaleDateString()}
                            </div>
                          )}
                          {visibleKeys.has(key.id) && key.key && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                              {key.key}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {key.key && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeyVisibility(key.id)}
                                title="Show/Hide full API key"
                              >
                                {visibleKeys.has(key.id) ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              {visibleKeys.has(key.id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(key.key!)}
                                  title="Copy full API key"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAnalyticsModal(key.key!);
                                  fetchAnalytics(key.key!);
                                }}
                                title="View subscribers and analytics"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBulkNotifyModal(key.key!)}
                                title="Send notification to all subscribers"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Analytics Modal */}
        {analyticsModal && (
          <Card className="border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Subscriber metrics for this API key
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setAnalyticsModal(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <p>Loading analytics...</p>
              ) : analyticsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Subscribers</div>
                      <div className="text-2xl font-bold">{analyticsData.subscriberCount || 0}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                      <div className="text-2xl font-bold">{analyticsData.engagementRate || 0}%</div>
                    </div>
                  </div>

                  {analyticsData.subscribers && analyticsData.subscribers.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Subscribers</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {analyticsData.subscribers.map((sub: Subscriber) => (
                          <div key={sub.subscriptionId} className="p-3 border rounded-lg text-sm">
                            <div className="font-medium">{sub.deviceName}</div>
                            <div className="text-muted-foreground text-xs">
                              Subscribed: {new Date(sub.subscribedAt).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground text-xs mt-1">
                              Received: {sub.stats.notificationsReceived} | 
                              Opened: {sub.stats.notificationsOpened} | 
                              Clicked: {sub.stats.notificationsClicked}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No subscribers yet</p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Bulk Notify Modal */}
        {bulkNotifyModal && (
          <Card className="border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Send Bulk Notification</CardTitle>
                  <CardDescription>
                    Send to all subscribers of this API key
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setBulkNotifyModal(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Notification Title</label>
                  <Input
                    placeholder="e.g., Special Offer!"
                    value={bulkNotifyTitle}
                    onChange={(e) => setBulkNotifyTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notification Body</label>
                  <Input
                    placeholder="e.g., Get 20% off today only"
                    value={bulkNotifyBody}
                    onChange={(e) => setBulkNotifyBody(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Image URL (optional)</label>
                  <Input
                    placeholder="e.g., https://example.com/image.jpg"
                    value={bulkNotifyImage}
                    onChange={(e) => setBulkNotifyImage(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBulkNotify(bulkNotifyModal)}
                    disabled={bulkNotifySending || !bulkNotifyTitle.trim() || !bulkNotifyBody.trim()}
                  >
                    {bulkNotifySending ? 'Sending...' : 'Send to All Subscribers'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setBulkNotifyModal(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
