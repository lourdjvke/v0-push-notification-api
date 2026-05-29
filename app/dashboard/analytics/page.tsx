'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

interface Stats {
  notificationsReceived: number;
  notificationsOpened: number;
  notificationsClicked: number;
  lastActivityAt?: string;
}

interface AnalyticsData {
  subscriptionId: string;
  stats: Stats;
  engagementRate: string;
  recentEvents: Array<{
    id: string;
    type: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [subscriptionId, setSubscriptionId] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchAnalytics() {
    if (!subscriptionId.trim()) {
      toast.error('Please enter a subscription ID');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics?subscriptionId=${encodeURIComponent(subscriptionId)}`
      );
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        toast.error(data.error || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      toast.error('Failed to fetch analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = analytics ? [
    {
      name: 'Sent',
      value: analytics.stats.notificationsReceived,
    },
    {
      name: 'Opened',
      value: analytics.stats.notificationsOpened,
    },
    {
      name: 'Clicked',
      value: analytics.stats.notificationsClicked,
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track notification performance and engagement</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Analytics</CardTitle>
            <CardDescription>
              Enter a subscription ID to view its analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="sub_1234567890..."
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchAnalytics();
                  }
                }}
              />
              <Button
                onClick={fetchAnalytics}
                disabled={!subscriptionId.trim() || loading}
              >
                {loading ? 'Loading...' : 'View Analytics'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {analytics && (
          <>
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.stats.notificationsReceived}</div>
                  <p className="text-xs text-muted-foreground">Total delivered</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Opened</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.stats.notificationsOpened}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.stats.notificationsReceived > 0
                      ? ((analytics.stats.notificationsOpened / analytics.stats.notificationsReceived) * 100).toFixed(1)
                      : 0}
                    % of sent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Clicked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.stats.notificationsClicked}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.stats.notificationsReceived > 0
                      ? ((analytics.stats.notificationsClicked / analytics.stats.notificationsReceived) * 100).toFixed(1)
                      : 0}
                    % of sent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.engagementRate}%</div>
                  <p className="text-xs text-muted-foreground">Opened or clicked</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Last 50 tracked events</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentEvents.length === 0 ? (
                  <p className="text-muted-foreground">No events tracked yet</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.recentEvents.slice(0, 20).map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 border-b last:border-0">
                        <span className="font-medium capitalize">{event.type}</span>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!analytics && (
          <Card className="border-dashed">
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                Enter a subscription ID above to view analytics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
