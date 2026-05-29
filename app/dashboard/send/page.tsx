'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface NotificationForm {
  apiKey: string;
  subscriptionIds: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  requireInteraction: boolean;
}

export default function SendNotificationPage() {
  const [form, setForm] = useState<NotificationForm>({
    apiKey: '',
    subscriptionIds: '',
    title: '',
    body: '',
    icon: '',
    image: '',
    badge: '',
    requireInteraction: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSend() {
    if (!form.apiKey.trim() || !form.subscriptionIds.trim() || !form.title.trim() || !form.body.trim()) {
      toast.error('API Key, Subscription IDs, Title, and Body are required');
      return;
    }

    try {
      setLoading(true);
      const subscriptionIdList = form.subscriptionIds
        .split('\n')
        .map(id => id.trim())
        .filter(Boolean);

      const payload = {
        subscriptionIds: subscriptionIdList.length > 1 ? subscriptionIdList : undefined,
        subscriptionId: subscriptionIdList.length === 1 ? subscriptionIdList[0] : undefined,
        notification: {
          title: form.title,
          body: form.body,
          icon: form.icon || undefined,
          image: form.image || undefined,
          badge: form.badge || undefined,
          requireInteraction: form.requireInteraction,
        },
      };

      const response = await fetch('/api/send?apikey=' + encodeURIComponent(form.apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success(`Sent to ${data.result.successful} device(s)`);
        
        if (data.result.failed > 0) {
          toast.warning(`Failed to send to ${data.result.failed} device(s)`);
        }
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error: any) {
      toast.error('Failed to send notification');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Send Notifications</h1>
          <p className="text-muted-foreground">Send push notifications to your subscribed users</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Notification</CardTitle>
              <CardDescription>Fill in the details to send a notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key *</label>
                <Input
                  type="password"
                  placeholder="sk_..."
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subscription IDs * (one per line)</label>
                <Textarea
                  placeholder="sub_1234567890&#10;sub_0987654321"
                  value={form.subscriptionIds}
                  onChange={(e) => setForm({ ...form, subscriptionIds: e.target.value })}
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  placeholder="Notification Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Body *</label>
                <Textarea
                  placeholder="Notification message body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon URL (optional)</label>
                <Input
                  placeholder="https://example.com/icon.png"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                <Input
                  placeholder="https://example.com/image.png"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Badge URL (optional)</label>
                <Input
                  placeholder="https://example.com/badge.png"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireInteraction}
                  onChange={(e) => setForm({ ...form, requireInteraction: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Require interaction (don&apos;t auto-dismiss)</span>
              </label>

              <Button
                onClick={handleSend}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview / Result */}
          <Card>
            <CardHeader>
              <CardTitle>Preview & Result</CardTitle>
              <CardDescription>
                {result ? 'Send result' : 'Notification preview'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Sent Successfully!</h4>
                    <div className="space-y-2 text-sm text-green-800">
                      <p>✓ Successful: {result.result.successful}</p>
                      {result.result.failed > 0 && (
                        <p>✗ Failed: {result.result.failed}</p>
                      )}
                      {result.result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc list-inside">
                            {result.result.errors.map((error: string, idx: number) => (
                              <li key={idx} className="text-xs">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setResult(null)}
                  >
                    Send Another
                  </Button>
                </>
              ) : (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        {form.title || 'Notification Title'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {form.body || 'Notification message preview will appear here'}
                      </p>
                    </div>
                    {form.image && (
                      <div className="mt-3 p-2 bg-background rounded">
                        <img
                          src={form.image}
                          alt="Notification"
                          className="max-w-full h-auto rounded max-h-32"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Code Examples */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">API Example</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 font-mono">
                  {`// Node.js / JavaScript
fetch('https://yourdomain.com/api/send?apikey=YOUR_API_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionIds: ['sub_123'],
    notification: {
      title: 'Hello',
      body: 'Test notification',
      icon: 'https://...',
    }
  })
}).then(r => r.json()).then(console.log)`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
