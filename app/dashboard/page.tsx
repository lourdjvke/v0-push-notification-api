'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toast, toast } from 'sonner';
import { Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  key?: string;
}

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load email from localStorage
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
        
        // Show the key once
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
                        </div>
                        <div className="flex gap-2">
                          {key.key && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeyVisibility(key.id)}
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
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
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

            {/* Integration Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
                <CardDescription>
                  How to use your API key in your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Using the Init Script</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`<script src="${window.location.origin}/api/init.js?apikey=YOUR_API_KEY"><\/script>`}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add this to your website to enable push notifications. Replace YOUR_API_KEY with your actual API key.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Check CORS Connectivity</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`fetch('${window.location.origin}/api/connection?apikey=YOUR_API_KEY')
  .then(res => res.json())
  .then(data => console.log(data))`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
